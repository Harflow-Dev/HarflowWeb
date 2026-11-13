import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asPendingLaunchId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Opens Pending launches and optional detail/Stop chrome after observations settle.
 */
export function applyPendingLaunchSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openPendingLaunches !== true && seed.openPendingLaunchId === undefined) {
    return
  }
  if (seed.openPendingLaunchId !== undefined) {
    const launchId = asPendingLaunchId(seed.openPendingLaunchId)
    presenter.openPendingLaunch(launchId)
    if (seed.pendingLaunchStopOutcome !== undefined) {
      presenter.seedPendingLaunchStopOutcome(seed.pendingLaunchStopOutcome)
    }
    if (seed.pendingLaunchStopConfirm === true) {
      whenLoaded(
        presenter,
        (state) => ({
          open:
            state.route === 'pending-launches' &&
            state.pendingLaunches.selectedLaunchId === launchId,
          kind: state.pendingLaunches.status.kind,
        }),
        () => presenter.setPendingLaunchStopConfirm(true),
      )
    }
    return
  }
  presenter.openPendingLaunches()
}
