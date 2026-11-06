import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  emptyNeedsYouLoad,
  literalNeedsYouObservation,
  partialNeedsYouObservation,
  unavailableNeedsYouLoad,
  waitingNeedsYouLoad,
} from '../adapters/mock/needsYouFixtures'
import { NeedsYouPage, NEEDS_YOU_ACTION_EXPLANATION } from './NeedsYouPage'

afterEach(() => {
  cleanup()
})

describe('NeedsYouPage', () => {
  it('renders typed waiting items as literal text and blocks unavailable actions', async () => {
    const user = userEvent.setup()
    const onOpenTask = vi.fn()
    const onOpenRun = vi.fn()
    render(
      <NeedsYouPage
        load={waitingNeedsYouLoad()}
        onOpenTask={onOpenTask}
        onOpenRun={onOpenRun}
      />,
    )

    expect(screen.getByText('3 waiting')).toBeInTheDocument()
    expect(screen.getByText('npm test -- --runInBand slot-release')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Push branch deps/audit-2026-11-03 and open a pull request in HarflowMCP',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Which config should win when both are set?'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()

    const approve = screen.getByRole('button', { name: 'Approve once' })
    const publish = screen.getByRole('button', { name: 'Approve this publish' })
    const send = screen.getByRole('button', { name: 'Send' })
    const openRun = screen.getByRole('button', {
      name: 'Open run Nightly dependency audit',
    })
    const reply = screen.getByRole('textbox', { name: 'Reply' })
    const openQuestion = screen.getByRole('button', {
      name: 'Open task Migrate events.jsonl reader',
    })
    for (const control of [approve, publish, send, reply, openQuestion]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).toHaveAccessibleDescription(NEEDS_YOU_ACTION_EXPLANATION)
    }
    await user.click(approve)
    await user.click(publish)
    await user.click(send)
    await user.click(openQuestion)
    expect(onOpenTask).not.toHaveBeenCalled()
    expect(openRun).toBeEnabled()
    openRun.focus()
    await user.keyboard('{Enter}')
    expect(onOpenRun).toHaveBeenCalledTimes(1)
    expect(onOpenRun).toHaveBeenCalledWith('run-nightly-dependency-audit')

    const openTask = screen.getByRole('button', {
      name: 'Open task Fix flaky slot release test',
    })
    openTask.focus()
    expect(openTask).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onOpenTask).toHaveBeenCalledTimes(1)
    expect(onOpenTask).toHaveBeenCalledWith('task-slot-release')
  })

  it('shows the approved empty state only for complete coverage with zero items', () => {
    const { rerender } = render(
      <NeedsYouPage load={emptyNeedsYouLoad()} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.getByText('Nothing needs you')).toBeInTheDocument()
    expect(
      screen.getByText(/Approvals and questions from running tasks and workflows/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/waiting/)).not.toBeInTheDocument()

    rerender(
      <NeedsYouPage
        load={{ kind: 'ready', observation: partialNeedsYouObservation() }}
        onOpenTask={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByText(/Coverage is incomplete/)).toBeInTheDocument()
    expect(screen.getByText('1 known. Not a complete total.')).toBeInTheDocument()
    expect(screen.queryByText('1 waiting')).not.toBeInTheDocument()

    rerender(<NeedsYouPage load={{ kind: 'loading' }} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />)
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Loading requests/)

    rerender(
      <NeedsYouPage load={unavailableNeedsYouLoad()} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Needs you is unavailable.')
  })

  it('keeps HTML-like prompt text as text', () => {
    const { container } = render(
      <NeedsYouPage
        load={{ kind: 'ready', observation: literalNeedsYouObservation() }}
        onOpenTask={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )
    expect(
      screen.getByText("<script>alert('x')</script> — café 日本語"),
    ).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Open task Literal question' }),
    ).toBeDisabled()
  })
})
