import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  emptyNeedsYouLoad,
  literalNeedsYouObservation,
  partialNeedsYouObservation,
  unavailableNeedsYouLoad,
  waitingNeedsYouLoad,
} from '../adapters/mock/needsYouFixtures'
import type { NeedsYouLoad, TaskId, WorkflowRunId } from '../model'
import type { NeedsYouScreenState } from '../presentation'
import { EMPTY_NEEDS_YOU_CHROME } from '../presentation/needsYouChrome'
import { NEEDS_YOU_QUESTION_EXPLANATION, NeedsYouPage } from './NeedsYouPage'

afterEach(() => {
  cleanup()
})

function needsYouStateFromLoad(load: NeedsYouLoad): NeedsYouScreenState {
  return {
    load,
    chrome: EMPTY_NEEDS_YOU_CHROME,
    displayItems: load.kind === 'ready' ? load.observation.items : [],
  }
}

function NeedsYouPageFromLoad({
  load,
  onOpenTask,
  onOpenRun,
}: {
  readonly load: NeedsYouLoad
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}) {
  return (
    <NeedsYouPage
      state={needsYouStateFromLoad(load)}
      onOpenTask={onOpenTask}
      onOpenRun={onOpenRun}
      onRespondTask={() => {}}
      onRefreshTask={() => {}}
      onRespondCheckpoint={() => {}}
      onRefreshCheckpoint={() => {}}
    />
  )
}

describe('NeedsYouPage', () => {
  it('renders typed waiting items as literal text and blocks unavailable actions', async () => {
    const user = userEvent.setup()
    const onOpenTask = vi.fn()
    const onOpenRun = vi.fn()
    render(
      <NeedsYouPageFromLoad
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

    const approveOnce = screen.getByRole('button', { name: 'Approve once' })
    const approveWorkflow = screen.getByRole('button', { name: 'Approve' })
    const send = screen.getByRole('button', { name: 'Send' })
    const openRun = screen.getByRole('button', {
      name: 'Open run Nightly dependency audit',
    })
    const reply = screen.getByRole('textbox', { name: 'Reply' })
    const openQuestion = screen.getByRole('button', {
      name: 'Open task Migrate events.jsonl reader',
    })
    expect(approveOnce).toBeEnabled()
    expect(approveWorkflow).toBeEnabled()
    for (const control of [send, reply, openQuestion]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).toHaveAccessibleDescription(NEEDS_YOU_QUESTION_EXPLANATION)
    }
    await user.click(approveOnce)
    await user.click(approveWorkflow)
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
      <NeedsYouPageFromLoad load={emptyNeedsYouLoad()} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.getByText('Nothing needs you')).toBeInTheDocument()
    expect(
      screen.getByText(/Approvals and questions from running tasks and workflows/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/waiting/)).not.toBeInTheDocument()

    rerender(
      <NeedsYouPageFromLoad
        load={{ kind: 'ready', observation: partialNeedsYouObservation() }}
        onOpenTask={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByText(/Coverage is incomplete/)).toBeInTheDocument()
    expect(screen.getByText('1 known. Not a complete total.')).toBeInTheDocument()
    expect(screen.queryByText('1 waiting')).not.toBeInTheDocument()

    rerender(
      <NeedsYouPageFromLoad load={unavailableNeedsYouLoad()} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Needs you is unavailable.')
  })

  it('renders main-pane loading skeleton without fake counts, empty, or actions', () => {
    render(
      <NeedsYouPageFromLoad load={{ kind: 'loading' }} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    const loading = screen.getByRole('group', { name: 'Loading Needs you' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(within(loading).getByRole('heading', { name: 'Needs you' })).toBeInTheDocument()
    expect(screen.queryByText('Nothing needs you')).not.toBeInTheDocument()
    expect(screen.queryByText('3 waiting')).not.toBeInTheDocument()
    expect(screen.queryByText(/Loading requests/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve once' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Reply' })).toBeNull()
    expect(loading.querySelectorAll('.hd-approval').length).toBe(3)
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })

  it('drops loading busy semantics when ready and restores them when loading returns', () => {
    const { rerender } = render(
      <NeedsYouPageFromLoad load={{ kind: 'loading' }} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.getByRole('group', { name: 'Loading Needs you' })).toHaveAttribute(
      'aria-busy',
      'true',
    )

    rerender(
      <NeedsYouPageFromLoad
        load={waitingNeedsYouLoad()}
        onOpenTask={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )
    expect(screen.queryByRole('group', { name: 'Loading Needs you' })).toBeNull()
    expect(screen.getByText('3 waiting')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve once' })).toBeEnabled()

    rerender(
      <NeedsYouPageFromLoad load={{ kind: 'loading' }} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.getByRole('group', { name: 'Loading Needs you' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.queryByText('3 waiting')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve once' })).toBeNull()
  })

  it('keeps HTML-like prompt text as text', () => {
    const { container } = render(
      <NeedsYouPageFromLoad
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
