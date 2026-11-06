import type { ObservationHandle, WorkflowRunId, WorkflowRunLoad } from '../model'
import type { EnginePort } from './enginePort'

export type LoadWorkflowExecutionUseCase = {
  observe(
    runId: WorkflowRunId,
    onUpdate: (load: WorkflowRunLoad) => void,
  ): ObservationHandle
}

/** Read-only graph for one run id. A definition id is not accepted as a run. */
export function createLoadWorkflowExecutionUseCase(
  engine: EnginePort,
): LoadWorkflowExecutionUseCase {
  return {
    observe(runId, onUpdate) {
      return engine.observeWorkflowExecution(runId, onUpdate)
    },
  }
}
