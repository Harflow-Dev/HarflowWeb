import { PendingLaunchesView } from '../components/PendingLaunchesView'
import type { AppPresenter, PendingLaunchesScreenState } from '../presentation'

type Props = {
  readonly state: PendingLaunchesScreenState
  readonly presenter: AppPresenter
}

/** Pending launches main pane. */
export function PendingLaunchesMain({ state, presenter }: Props) {
  return (
    <PendingLaunchesView
      state={state}
      onOpenLaunch={(id) => presenter.openPendingLaunch(id)}
      onStopConfirm={(open) => presenter.setPendingLaunchStopConfirm(open)}
    />
  )
}
