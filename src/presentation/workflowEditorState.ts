import type { WorkflowEditorLoad, WorkflowId, WorkflowNodeId } from '../model'

export type WorkflowEditorScreenState = {
  readonly workflowId: WorkflowId | null
  readonly load: WorkflowEditorLoad
  /** Per definition. A missing node id stays here and is not replaced. */
  readonly selections: Readonly<Record<string, WorkflowNodeId | null>>
}

export function initialWorkflowEditorState(): WorkflowEditorScreenState {
  return {
    workflowId: null,
    load: { kind: 'loading' },
    selections: {},
  }
}
