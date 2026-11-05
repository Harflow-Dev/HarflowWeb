import type { WorkflowsLoad } from '../model'

export type WorkflowsScreenState = {
  readonly load: WorkflowsLoad
}

export function initialWorkflowsState(): WorkflowsScreenState {
  return { load: { kind: 'loading' } }
}
