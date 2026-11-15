import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/** Seeds Changes-pane chrome after the task is ready and the pane is open. */
export function applyTaskChangesSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openTaskId === undefined) return
  if (seed.changesChrome === undefined) return
  const taskId = asTaskId(seed.openTaskId)
  const chrome = seed.changesChrome
  whenLoaded(
    presenter,
    // The pane opens after the task load settles (applyTaskOpenSeed), so a
    // closed pane means "not yet", not "no longer the seeded item".
    (state) => ({
      open: state.task.selectedTaskId === taskId,
      kind: state.task.changesPaneOpen ? state.task.load.kind : 'loading',
    }),
    () => presenter.seedTaskChangesChrome(taskId, chrome),
  )
}
