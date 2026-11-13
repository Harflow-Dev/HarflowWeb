import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import {
  PENDING_LAUNCH_A,
  pendingInventoryReady,
} from '../adapters/mock/pendingLaunchFixtures'
import {
  applyNewTaskSeed,
  createApp,
  PreviewShell,
} from '../composition'
import { PENDING_COPY } from '../presentation/pendingLaunchCopy'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function mount(scenario: ScenarioId) {
  const app = createApp(scenario)
  render(<AppFeature presenter={app.presenter} />)
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  await act(async () => {
    applyNewTaskSeed(app.presenter, scenarioById(scenario).seed)
    await Promise.resolve()
    await Promise.resolve()
  })
  return app
}

function sidebar(): Element {
  const found = document.querySelector('aside.hd-sidebar, aside.hd-rail')
  if (!found) throw new Error('sidebar not rendered')
  return found
}

function mainNav() {
  return within(screen.getByRole('navigation', { name: 'Main' }))
}

describe('Pending launches capability-gated navigation', () => {
  it('hides the Pending launches nav item when the capability is unsupported', async () => {
    await mount('populated')
    expect(
      mainNav().queryByRole('button', { name: 'Pending launches' }),
    ).toBeNull()
  })

  it('shows the Pending launches nav item when the capability is supported and keeps it selected on detail', async () => {
    const app = await mount('pending-launches-waiting')
    const item = mainNav().getByRole('button', { name: 'Pending launches' })
    expect(item).toHaveAttribute('aria-current', 'page')
    expect(app.presenter.getState().route).toBe('pending-launches')
    expect(app.presenter.getState().pendingLaunches.selectedLaunchId).toBe(
      PENDING_LAUNCH_A,
    )
  })
})

describe('Pending launches inventory family', () => {
  it('shows inventory heading, full launch IDs, and opens a locked detail on selection', async () => {
    const user = userEvent.setup()
    const app = await mount('pending-launches-inventory')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.inventoryHeading }),
    ).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.inventoryLead)).toBeInTheDocument()
    expect(screen.getByText(PENDING_LAUNCH_A)).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: /Review launch admission checks/,
      }),
    )
    expect(app.presenter.getState().pendingLaunches.selectedLaunchId).toBe(
      PENDING_LAUNCH_A,
    )
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.waitingHeading }),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(PENDING_COPY.composerPlaceholder),
    ).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  })

  it('shows empty copy without listing entries', async () => {
    await mount('pending-launches-empty')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.emptyHeading }),
    ).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.emptyLead)).toBeInTheDocument()
    expect(screen.queryByText(PENDING_LAUNCH_A)).toBeNull()
  })

  it('shows failed copy and keeps Check again unavailable', async () => {
    await mount('pending-launches-failed')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.failedHeading }),
    ).toBeInTheDocument()
    const check = screen.getByRole('button', { name: PENDING_COPY.checkAgain })
    expect(check).toBeDisabled()
    expect(check).toHaveAccessibleDescription(
      PENDING_COPY.checkAgainUnavailable,
    )
  })

  it('keeps incomplete entries plus the coverage warning and never shows empty', async () => {
    await mount('pending-launches-incomplete')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.incompleteHeading }),
    ).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.incompleteLead)).toBeInTheDocument()
    expect(screen.getByText(PENDING_LAUNCH_A)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: PENDING_COPY.emptyHeading }),
    ).toBeNull()
    const next = screen.getByRole('button', {
      name: PENDING_COPY.checkNextPage,
    })
    expect(next).toBeDisabled()
  })
})

describe('Pending launches detail family', () => {
  it('shows waiting copy without forbidden task controls', async () => {
    await mount('pending-launches-waiting')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.waitingHeading }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Waiting for Claude slots and Shared checkout. Harflow has not confirmed a running task yet.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: PENDING_COPY.stop })).toBeEnabled()
    expect(screen.queryByLabelText('Task prompt')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send now' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Take over' })).toBeNull()
  })

  it('shows preparing-handshake Stop unavailable with its explanation', async () => {
    await mount('pending-launches-preparing-handshake')
    expect(
      screen.getByRole('heading', {
        name: PENDING_COPY.preparingHandshakeHeading,
      }),
    ).toBeInTheDocument()
    const stop = screen.getByRole('button', { name: PENDING_COPY.stop })
    expect(stop).toBeDisabled()
    expect(stop).toHaveAccessibleDescription(
      PENDING_COPY.stopHandshakeUnavailable,
    )
  })

  it('shows recorded Check task status unavailable without fabricating a task handoff', async () => {
    await mount('pending-launches-recorded')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.recordedHeading }),
    ).toBeInTheDocument()
    const check = screen.getByRole('button', {
      name: PENDING_COPY.checkTaskStatus,
    })
    expect(check).toBeDisabled()
    expect(check).toHaveAccessibleDescription(
      PENDING_COPY.checkTaskUnavailable,
    )
    expect(screen.queryByRole('button', { name: PENDING_COPY.stop })).toBeNull()
  })

  it('keeps handoff-failed on the launch selection with no task controls', async () => {
    const app = await mount('pending-launches-handoff-failed')
    expect(app.presenter.getState().pendingLaunches.selectedLaunchId).toBe(
      PENDING_LAUNCH_A,
    )
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.handoffFailedHeading }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
  })

  it('shows stop-requested, stop-uncertain, and stop-refused as their own scenarios', async () => {
    await mount('pending-launches-stop-requested')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.stopRequestedHeading }),
    ).toBeInTheDocument()
    expect(screen.getByText(PENDING_COPY.unconfirmedStopNote)).toBeInTheDocument()
    cleanup()
    await mount('pending-launches-stop-uncertain')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.stopUncertainHeading }),
    ).toBeInTheDocument()
    cleanup()
    await mount('pending-launches-stop-refused')
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.stopRefusedHeading }),
    ).toBeInTheDocument()
  })
})

describe('Pending launches Stop sheet at app level', () => {
  it('makes sidebar and main inert and returns focus to Stop after Escape and Cancel', async () => {
    const user = userEvent.setup()
    await mount('pending-launches-waiting')
    const trigger = screen.getByRole('button', { name: PENDING_COPY.stop })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: PENDING_COPY.stopConfirmHeading,
    })
    expect(dialog.closest('.hd-app')).not.toBeNull()
    expect(dialog.closest('main')).toBeNull()
    expect(sidebar()).toHaveAttribute('inert')
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert')
    expect(
      within(dialog).getByRole('button', { name: PENDING_COPY.cancel }),
    ).toHaveFocus()
    expect(
      within(dialog).getByRole('button', { name: PENDING_COPY.requestStop }),
    ).toHaveAccessibleDescription(PENDING_COPY.requestStopUnavailable)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(sidebar()).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: PENDING_COPY.stop })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: PENDING_COPY.stop }))
    await user.click(screen.getByRole('button', { name: PENDING_COPY.cancel }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: PENDING_COPY.stop })).toHaveFocus()
  })

  it('boots the stop-confirm preview scenario through the seeding path', async () => {
    window.location.hash = '#pending-launches-stop-confirm'
    render(<PreviewShell />)
    const dialog = await screen.findByRole('dialog', {
      name: PENDING_COPY.stopConfirmHeading,
    })
    expect(
      within(dialog).getByRole('button', { name: PENDING_COPY.cancel }),
    ).toHaveFocus()
    expect(sidebar()).toHaveAttribute('inert')
  })

  it('resets Stop confirm when the pending route is reopened', async () => {
    const user = userEvent.setup()
    const app = await mount('pending-launches-waiting')
    await user.click(screen.getByRole('button', { name: PENDING_COPY.stop }))
    expect(app.presenter.getState().pendingLaunches.stopConfirm).toBe(true)
    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().pendingLaunches.stopConfirm).toBe(false)
    await act(async () => app.presenter.openPendingLaunch(PENDING_LAUNCH_A))
    expect(app.presenter.getState().pendingLaunches.stopConfirm).toBe(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Pending launches deferred inventory load', () => {
  it('resolves a deferred inventory observation through the mock port', async () => {
    const app = await mount('pending-launches-loading')
    expect(
      screen.getByRole('group', { name: PENDING_COPY.loadingHeading }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(app.presenter.getState().pendingLaunches.inventory.kind).toBe(
      'loading',
    )
    act(() => {
      app.mock.publishPendingLaunchInventory(pendingInventoryReady())
    })
    await waitFor(() =>
      expect(app.presenter.getState().pendingLaunches.inventory.kind).toBe(
        'ready',
      ),
    )
    expect(
      screen.getByRole('heading', { name: PENDING_COPY.inventoryHeading }),
    ).toBeInTheDocument()
  })
})
