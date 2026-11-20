import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Seeds approval respond refusals once the open task's observation is ready.
 */
export function applyTaskApprovalSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openTaskId === undefined) return
  if (seed.taskApprovalRefusals === undefined) return
  const taskId = asTaskId(seed.openTaskId)
  const refusals = seed.taskApprovalRefusals
  whenLoaded(
    presenter,
    (state) => ({
      open: state.task.selectedTaskId === taskId,
      kind: state.task.load.kind,
    }),
    () =>
      presenter.seedTaskApprovalChrome(taskId, {
        refusals: refusals.map((entry) => ({
          requestId: entry.requestId,
          refusal: {
            reason: entry.reason,
            ...(entry.interaction !== undefined
              ? { interaction: entry.interaction }
              : {}),
          },
        })),
      }),
  )
}
