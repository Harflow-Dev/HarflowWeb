import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PENDING_LAUNCH_A } from '../adapters/mock/pendingLaunchFixtures'
import { PENDING_COPY } from '../presentation/pendingLaunchCopy'
import { PendingLaunchStopDialog } from './PendingLaunchStopDialog'

afterEach(() => {
  cleanup()
})

describe('PendingLaunchStopDialog', () => {
  it('starts on Cancel, keeps Request Stop unavailable with explanation, and closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <PendingLaunchStopDialog launchId={PENDING_LAUNCH_A} onClose={onClose} />,
    )
    const dialog = screen.getByRole('dialog', {
      name: PENDING_COPY.stopConfirmHeading,
    })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText(PENDING_LAUNCH_A)).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.stopConfirmLead)).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.stopConfirmDetail)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: PENDING_COPY.cancel })).toHaveFocus()
    const request = screen.getByRole('button', { name: PENDING_COPY.requestStop })
    expect(request).toBeDisabled()
    expect(request).toHaveAccessibleDescription(
      PENDING_COPY.requestStopUnavailable,
    )
    await user.click(request)
    expect(onClose).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose from Cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <PendingLaunchStopDialog launchId={PENDING_LAUNCH_A} onClose={onClose} />,
    )
    await user.click(screen.getByRole('button', { name: PENDING_COPY.cancel }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
