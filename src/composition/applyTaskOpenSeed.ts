import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Opens a task, optional Events pane, and M05 command chrome after load settles.
 */
export function applyTaskOpenSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openTaskId === undefined) return
  const taskId = asTaskId(seed.openTaskId)
  presenter.openTask(taskId)
  if (seed.eventsPaneOpen === true) {
    whenLoaded(
      presenter,
      (state) => ({
        open: state.task.selectedTaskId === taskId,
        kind: state.task.load.kind,
      }),
      () => presenter.setTaskChangesPaneOpen(true),
    )
  }
  if (seed.taskCommandChrome !== undefined) {
    const chrome = seed.taskCommandChrome
    whenLoaded(
      presenter,
      (state) => ({
        open: state.task.selectedTaskId === taskId,
        kind: state.task.load.kind,
      }),
      () => presenter.seedTaskCommandChrome(chrome),
    )
  }
}