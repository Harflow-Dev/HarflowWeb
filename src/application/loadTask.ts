import type { ObservationHandle, TaskId, TaskLoad } from '../model'
import type { EnginePort } from './enginePort'

export type LoadTaskUseCase = {
  observe(
    taskId: TaskId,
    onUpdate: (load: TaskLoad) => void,
  ): ObservationHandle
}

export function createLoadTaskUseCase(engine: EnginePort): LoadTaskUseCase {
  return {
    observe(taskId, onUpdate) {
      return engine.observeTask(taskId, onUpdate)
    },
  }
}
