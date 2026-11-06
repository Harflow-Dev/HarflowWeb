import type { WorkflowNodeId, WorkflowRunId, WorkflowRunLoad } from '../model'

export type WorkflowExecutionScreenState = {
  readonly runId: WorkflowRunId | null
  readonly load: WorkflowRunLoad
  /** Presentation choice. Null uses the observation's selected node. */
  readonly selectedNodeId: WorkflowNodeId | null
}

export function initialWorkflowExecutionState(): WorkflowExecutionScreenState {
  return { runId: null, load: { kind: 'loading' }, selectedNodeId: null }
}
