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

type WhenLoaded = (
  presenter: AppPresenter,
  probe: (state: AppScreenState) => LoadProbe,
  apply: () => void,
) => void

function afterTaskReady(
  presenter: AppPresenter,
  whenLoaded: WhenLoaded,
  taskId: ReturnType<typeof asTaskId>,
  apply: () => void,
  requirePane = false,
): void {
  whenLoaded(
    presenter,
    (state) => ({
      open:
        state.task.selectedTaskId === taskId &&
        (!requirePane || state.task.changesPaneOpen),
      kind: state.task.load.kind,
    }),
    apply,
  )
}

/**
 * Opens a task, optional Events pane, and M05 command chrome after load settles.
 */
export function applyTaskOpenSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: WhenLoaded,
): void {
  if (seed.openTaskId === undefined) return
  const taskId = asTaskId(seed.openTaskId)
  presenter.openTask(taskId)
  if (seed.paneTab !== undefined) {
    const tab = seed.paneTab
    afterTaskReady(presenter, whenLoaded, taskId, () =>
      presenter.setTaskPaneTab(tab),
    )
  }
  if (seed.eventsPaneOpen === true) {
    if (seed.openPaneWhileLoading === true) {
      presenter.setTaskChangesPaneOpen(true)
      if (seed.paneTab !== undefined) {
        presenter.setTaskPaneTab(seed.paneTab)
      }
    } else {
      afterTaskReady(presenter, whenLoaded, taskId, () =>
        presenter.setTaskChangesPaneOpen(true),
      )
    }
  }
  if (seed.eventsFactsReveal !== undefined) {
    const group = seed.eventsFactsReveal
    afterTaskReady(
      presenter,
      whenLoaded,
      taskId,
      () => presenter.revealTaskEventsFacts(group),
      true,
    )
  }
  if (seed.taskCommandChrome !== undefined) {
    const chrome = seed.taskCommandChrome
    afterTaskReady(presenter, whenLoaded, taskId, () =>
      presenter.seedTaskCommandChrome(taskId, chrome),
    )
  }
  applyTaskEventsSeed(presenter, seed, whenLoaded)
  applyTaskOverflowSeed(presenter, seed, whenLoaded)
  applyTaskChangesSeed(presenter, seed, whenLoaded)
}
