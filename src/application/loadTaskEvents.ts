import type {
  ObservationHandle,
  TaskEventsLoad,
  TaskEventsQuery,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadTaskEventsUseCase = {
  observe(
    query: TaskEventsQuery,
    onUpdate: (load: TaskEventsLoad) => void,
  ): ObservationHandle
}

export function createLoadTaskEventsUseCase(
  engine: EnginePort,
): LoadTaskEventsUseCase {
  return {
    observe(query, onUpdate) {
      return engine.observeTaskEvents(query, onUpdate)
    },
  }
}