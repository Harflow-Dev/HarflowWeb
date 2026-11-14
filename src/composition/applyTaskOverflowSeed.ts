import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/** Seeds overflow menu / confirmation dialog chrome after the task is ready. */
export function applyTaskOverflowSeed(
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
  if (seed.taskOverflowAnchorOmitted === true) {
    presenter.seedTaskOverflowChrome(taskId, { anchorOmitted: true })
  }
  const wantsOverflow =
    seed.taskOverflowMenuOpen === true || seed.taskDialog !== undefined
  if (!wantsOverflow) return
  whenLoaded(
    presenter,
    (state) => ({
      open: state.task.selectedTaskId === taskId,
      kind: state.task.load.kind,
    }),
    () =>
      presenter.seedTaskOverflowChrome(taskId, {
        ...(seed.taskOverflowMenuOpen !== undefined
          ? { overflowMenuOpen: seed.taskOverflowMenuOpen }
          : {}),
        ...(seed.taskDialog !== undefined
          ? { dialog: seed.taskDialog, dialogOpener: null }
          : {}),
      }),
  )
}
