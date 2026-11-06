import type {
  ObservationHandle,
  WorkflowId,
  WorkflowRunContextLoad,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadWorkflowRunUseCase = {
  observe(
    workflowId: WorkflowId,
    onUpdate: (load: WorkflowRunContextLoad) => void,
  ): ObservationHandle
}

export function createLoadWorkflowRunUseCase(
  engine: EnginePort,
): LoadWorkflowRunUseCase {
  return {
    observe(workflowId, onUpdate) {
      return engine.observeWorkflowRun(workflowId, onUpdate)
    },
  }
}
