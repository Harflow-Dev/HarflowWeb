import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Seeds messaging command outcomes (cancelled / delivered outcome line,
 * Send now refusals) once the open task's observation is ready.
 */
export function applyTaskMessagingSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  if (seed.openTaskId === undefined) return
  const wantsOutcome = seed.taskMessagingOutcome !== undefined
  const wantsRefusals = seed.taskSendNowRefusals !== undefined
  if (!wantsOutcome && !wantsRefusals) return
  const taskId = asTaskId(seed.openTaskId)
  whenLoaded(
    presenter,
    (state) => ({
      open: state.task.selectedTaskId === taskId,
      kind: state.task.load.kind,
    }),
    () =>
      presenter.seedTaskMessagingChrome(taskId, {
        ...(seed.taskMessagingOutcome !== undefined
          ? { outcome: seed.taskMessagingOutcome }
          : {}),
        ...(seed.taskSendNowRefusals !== undefined
          ? {
              refusals: seed.taskSendNowRefusals.map((entry) => ({
                messageId: entry.messageId,
                refusal: { code: entry.code, message: entry.message },
              })),
            }
          : {}),
      }),
  )
}
