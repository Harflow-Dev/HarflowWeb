/** Opaque identifiers — values only, no I/O. */

export type RepositoryId = string & { readonly __brand: 'RepositoryId' }
export type HarnessId = string & { readonly __brand: 'HarnessId' }
export type ModelId = string & { readonly __brand: 'ModelId' }
export type TaskId = string & { readonly __brand: 'TaskId' }
export type WorkflowId = string & { readonly __brand: 'WorkflowId' }
export type WorkflowNodeId = string & { readonly __brand: 'WorkflowNodeId' }
export type ObservationId = string & { readonly __brand: 'ObservationId' }

export function asRepositoryId(value: string): RepositoryId {
  return value as RepositoryId
}

export function asHarnessId(value: string): HarnessId {
  return value as HarnessId
}

export function asModelId(value: string): ModelId {
  return value as ModelId
}

export function asTaskId(value: string): TaskId {
  return value as TaskId
}

export function asWorkflowId(value: string): WorkflowId {
  return value as WorkflowId
}

export function asWorkflowNodeId(value: string): WorkflowNodeId {
  return value as WorkflowNodeId
}

export function asObservationId(value: string): ObservationId {
  return value as ObservationId
}
