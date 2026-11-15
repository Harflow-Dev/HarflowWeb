import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'
import { applyTaskChangesSeed } from './applyTaskChangesSeed'
import { applyTaskEventsSeed } from './applyTaskEventsSeed'
import { applyTaskOverflowSeed } from './applyTaskOverflowSeed'

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
  if (seed.paneTab !== undefined) {
    const tab = seed.paneTab
    whenLoaded(
      presenter,
      (state) => ({
        open: state.task.selectedTaskId === taskId,
        kind: state.task.load.kind,
      }),
      () => presenter.setTaskPaneTab(tab),
    )
  }
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
      () => presenter.seedTaskCommandChrome(taskId, chrome),
    )
  }
  applyTaskEventsSeed(presenter, seed, whenLoaded)
  applyTaskOverflowSeed(presenter, seed, whenLoaded)
  applyTaskChangesSeed(presenter, seed, whenLoaded)
}