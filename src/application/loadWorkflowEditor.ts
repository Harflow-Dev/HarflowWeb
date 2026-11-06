import type { ObservationHandle, WorkflowEditorLoad, WorkflowId } from '../model'
import type { EnginePort } from './enginePort'

export type LoadWorkflowEditorUseCase = {
  observe(
    workflowId: WorkflowId,
    onUpdate: (load: WorkflowEditorLoad) => void,
  ): ObservationHandle
}

/** Read-only editor preview for one definition id. */
export function createLoadWorkflowEditorUseCase(
  engine: EnginePort,
): LoadWorkflowEditorUseCase {
  return {
    observe(workflowId, onUpdate) {
      return engine.observeWorkflowEditor(workflowId, onUpdate)
    },
  }
}
