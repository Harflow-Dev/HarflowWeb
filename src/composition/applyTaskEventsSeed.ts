import type { NewTaskScenarioSeed } from '../adapters/mock'
import { asTaskId } from '../model'
import type { AppPresenter, AppScreenState } from '../presentation'

type LoadProbe = {
  readonly open: boolean
  readonly kind: 'loading' | 'unavailable' | 'ready'
}

/**
 * Asks for the older Events page once the Events read is ready, as a person's
 * Load earlier would. The mock engine decides the answer.
 */
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
  if (seed.eventsLoadEarlier !== true) return
  const taskId = asTaskId(seed.openTaskId)
  whenLoaded(
    presenter,
    (state) => {
      const { selectedTaskId, load, eventsLoad, changesPaneOpen } = state.task
      if (selectedTaskId !== taskId) return { open: false, kind: 'loading' }
      if (load.kind !== 'ready') return { open: true, kind: load.kind }
      const waiting = !changesPaneOpen || eventsLoad.kind === 'loading'
      return {
        open: true,
        kind: waiting ? 'loading' : eventsLoad.kind === 'ready' ? 'ready' : 'unavailable',
      }
    },
    () => presenter.loadTaskEarlierEvents(),
  )
}
