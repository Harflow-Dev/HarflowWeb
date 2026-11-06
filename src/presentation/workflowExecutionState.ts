import type { WorkflowRunId, WorkflowRunLoad } from '../model'

export type WorkflowExecutionScreenState = {
  readonly runId: WorkflowRunId | null
  readonly load: WorkflowRunLoad
}

export function initialWorkflowExecutionState(): WorkflowExecutionScreenState {
  return { runId: null, load: { kind: 'loading' } }
}
