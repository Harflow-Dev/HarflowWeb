import type {
  ObservationHandle,
  ParallelGroupId,
  ParallelGroupLoad,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadParallelGroupUseCase = {
  observe(
    groupId: ParallelGroupId,
    onUpdate: (load: ParallelGroupLoad) => void,
  ): ObservationHandle
}

/** Read-only Parallel group for one group id. A task id is not accepted. */
export function createLoadParallelGroupUseCase(
  engine: EnginePort,
): LoadParallelGroupUseCase {
  return {
    observe(groupId, onUpdate) {
      return engine.observeParallelGroup(groupId, onUpdate)
    },
  }
}
