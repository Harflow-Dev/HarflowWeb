import type {
  ObservationHandle,
  TaskChangesLoad,
  TaskChangesQuery,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadTaskChangesUseCase = {
  observe(
    query: TaskChangesQuery,
    onUpdate: (load: TaskChangesLoad) => void,
  ): ObservationHandle
}

export function createLoadTaskChangesUseCase(
  engine: EnginePort,
): LoadTaskChangesUseCase {
  return {
    observe(query, onUpdate) {
      return engine.observeTaskChanges(query, onUpdate)
    },
  }
}
