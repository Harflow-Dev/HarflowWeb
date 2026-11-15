import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/** Seeds Events-tab chrome after the task is ready and the pane is open. */
export function applyTaskEventsSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openTaskId === undefined) return
  if (seed.eventsChrome === undefined) return
  const taskId = asTaskId(seed.openTaskId)
  const chrome = seed.eventsChrome
  whenLoaded(
    presenter,
    (state) => {
      const kind = state.task.load.kind
      return {
        open: state.task.selectedTaskId === taskId,
        kind: kind === 'ready' && !state.task.changesPaneOpen ? 'loading' : kind,
      }
    },
    () => presenter.seedTaskEventsChrome(taskId, chrome),
  )
}
