import type { NewTaskScenarioSeed } from '../adapters/mock'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Seeds Needs you approval / checkpoint chrome once the inbox observation
 * is ready and the route is Needs you.
 */
export function applyNeedsYouApprovalSeed(
  presenter: AppPresenter,
  seed: NewTaskScenarioSeed,
  whenLoaded: (
    presenter: AppPresenter,
    probe: (state: AppScreenState) => LoadProbe,
    apply: () => void,
  ) => void,
): void {
  const refusals = seed.needsYouApprovalRefusals
  const checkpointStale = seed.needsYouCheckpointStale
  if (refusals === undefined && checkpointStale === undefined) return
  whenLoaded(
    presenter,
    (state) => ({
      open: state.route === 'needs-you',
      kind: state.needsYou.load.kind,
    }),
    () =>
      presenter.seedNeedsYouApprovalChrome({
        ...(refusals !== undefined
          ? {
              refusals: refusals.map((entry) => ({
                taskId: entry.taskId,
                requestId: entry.requestId,
                refusal: {
                  reason: entry.reason,
                  ...(entry.interaction !== undefined
                    ? { interaction: entry.interaction }
                    : {}),
                },
              })),
            }
          : {}),
        ...(checkpointStale !== undefined
          ? { checkpointStale }
          : {}),
      }),
  )
}
