import type { WorkflowId, WorkflowRunContextLoad, WorkflowRunDraft, WorkflowsLoad } from '../model'

export type WorkflowsScreenState = {
  readonly load: WorkflowsLoad
  readonly runWorkflowId: WorkflowId | null
  readonly drafts: Readonly<Record<string, WorkflowRunDraft>>
  readonly runContext: WorkflowRunContextLoad
}

export function initialWorkflowsState(): WorkflowsScreenState {
  return {
    load: { kind: 'loading' },
    runWorkflowId: null,
    drafts: {},
    runContext: { kind: 'loading' },
  }
}
