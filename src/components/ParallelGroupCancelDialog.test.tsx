import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParallelGroupCancelDialog } from './ParallelGroupCancelDialog'
import { PARALLEL_GROUP_ACTION_EXPLANATION } from './parallelGroupUnavailable'

afterEach(() => {
  cleanup()
})

describe('ParallelGroupCancelDialog', () => {
  it('starts on Cancel, keeps Cancel all unavailable, and closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ParallelGroupCancelDialog onClose={onClose} />)
    const dialog = screen.getByRole('dialog', {
      name: 'Cancel every running task in this group?',
    })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    const danger = screen.getByRole('button', { name: 'Cancel all' })
    expect(danger).toBeDisabled()
    expect(danger).toHaveAccessibleDescription(PARALLEL_GROUP_ACTION_EXPLANATION)
    await user.click(danger)
    expect(onClose).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps focus on the only focusable control for Tab and Shift+Tab', async () => {
    const user = userEvent.setup()
    render(<ParallelGroupCancelDialog onClose={() => {}} />)
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    await user.tab()
    expect(cancel).toHaveFocus()
    await user.tab({ shift: true })
    expect(cancel).toHaveFocus()
  })

  it('calls onClose from Cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ParallelGroupCancelDialog onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
