import type { WorkflowId } from './ids'

/**
 * Read-only workflow definition summary for the Workflows list.
 * Definitions are not runs — no run status belongs here.
 */
export type WorkflowSummary = {
  readonly id: WorkflowId
  readonly title: string
  readonly description: string
  /** Node count from the approved list specimen. */
  readonly nodeCount: number
}

export type WorkflowsLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly workflows: readonly WorkflowSummary[] }
