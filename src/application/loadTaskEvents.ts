import type {
  ObservationHandle,
  TaskEventsLoad,
  TaskEventsOlderLoad,
  TaskEventsOlderQuery,
  TaskEventsQuery,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadTaskEventsUseCase = {
  observe(
    query: TaskEventsQuery,
    onUpdate: (load: TaskEventsLoad) => void,
  ): ObservationHandle
  /** One older-page read from a cursor; answers once. */
  observeOlder(
    query: TaskEventsOlderQuery,
    onUpdate: (load: TaskEventsOlderLoad) => void,
  ): ObservationHandle
}

export function createLoadTaskEventsUseCase(
  engine: EnginePort,
): LoadTaskEventsUseCase {
  return {
    observe(query, onUpdate) {
      return engine.observeTaskEvents(query, onUpdate)
    },
    observeOlder(query, onUpdate) {
      return engine.observeTaskEventsOlder(query, onUpdate)
    },
  }
}
