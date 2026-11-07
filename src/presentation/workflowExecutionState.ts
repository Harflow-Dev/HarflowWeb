import type { WorkflowNodeId, WorkflowRunId, WorkflowRunLoad } from '../model'
import type { WorkflowRunViewMode } from './workflowRunParallel'

export type WorkflowExecutionScreenState = {
  readonly runId: WorkflowRunId | null
  readonly load: WorkflowRunLoad
  /** Presentation choice. Null uses the observation's selected node. */
  readonly selectedNodeId: WorkflowNodeId | null
  /** Presentation choice. Graph when Parallel lanes are missing. */
  readonly viewMode: WorkflowRunViewMode
}

export function initialWorkflowExecutionState(): WorkflowExecutionScreenState {
  return {
    runId: null,
    load: { kind: 'loading' },
    selectedNodeId: null,
    viewMode: 'graph',
  }
}
