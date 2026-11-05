import type { ObservationHandle, WorkflowsLoad } from '../model'
import type { EnginePort } from './enginePort'

export type LoadWorkflowsUseCase = {
  observe(onUpdate: (load: WorkflowsLoad) => void): ObservationHandle
}

export function createLoadWorkflowsUseCase(
  engine: EnginePort,
): LoadWorkflowsUseCase {
  return {
    observe(onUpdate) {
      return engine.observeWorkflows(onUpdate)
    },
  }
}
