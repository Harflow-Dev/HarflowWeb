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
    (state) => ({
      open: state.task.selectedTaskId === taskId && state.task.changesPaneOpen,
      kind: state.task.load.kind,
    }),
    () => presenter.seedTaskChangesChrome(taskId, chrome),
  )
}
