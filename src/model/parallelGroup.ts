import type { ParallelGroupId } from './ids'
import type { WorkflowRunLane } from './workflowExecution'

/**
 * A Parallel group observation.
 * groupId is not a task id or workflow run id.
 */

export type ParallelGroupObservation = {
  readonly groupId: ParallelGroupId
  readonly title: string
  readonly statusLabel: string
  readonly enforcementLabel: string
  readonly lanes: readonly WorkflowRunLane[]
}

export type ParallelGroupLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly group: ParallelGroupObservation }

export const PARALLEL_GROUP_UNAVAILABLE = 'This parallel group is unavailable.'
