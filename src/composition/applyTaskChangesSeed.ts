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
    // ready task with a closed pane means "not yet". Any other load kind is
    // reported as is, so an unavailable task ends the wait.
    (state) => {
      const kind = state.task.load.kind
      return {
        open: state.task.selectedTaskId === taskId,
        kind: kind === 'ready' && !state.task.changesPaneOpen ? 'loading' : kind,
      }
    },
    () => presenter.seedTaskChangesChrome(taskId, chrome),
  )
}
