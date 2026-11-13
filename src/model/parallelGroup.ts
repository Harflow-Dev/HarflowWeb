import type { ParallelGroupId, TaskId } from './ids'
import type { WorkflowRunLaneBlock } from './workflowExecution'

/**
 * A Parallel group observation.
 * groupId is not a task id or workflow run id.
 */

/** Badge tint for the group top bar. Null when the badge is omitted. */
export type ParallelGroupBadgeTone =
  | 'running'
  | 'done'
  | 'failed'
  | 'neutral'

/** Lane status for the Parallel group screen. */
export type ParallelGroupLaneStatus =
  | 'done'
  | 'running'
  | 'pending'
  | 'failed'
  | 'cancelled'

/** Composer row under a Parallel group lane. */
export type ParallelGroupLaneComposer = {
  readonly locked: boolean
  readonly disabled: boolean
  /** Locked-lane placeholder; otherwise the Message <Harness> label is used. */
  readonly placeholder: string | null
  /** Caption under the composer (e.g. messaging unavailable). */
  readonly note: string | null
}

/** End row under a settled lane body. */
export type ParallelGroupLaneEnd = {
  readonly kind: 'done' | 'failed' | 'cancelled'
  readonly clock: string
  /** Extra clause after the status word, e.g. "taken over". */
  readonly extra: string | null
}

/**
 * One Parallel group lane.
 * Lane ids are observation facts for this group, not graph node ids.
 */
export type ParallelGroupLane = {
  readonly id: string
  readonly title: string
  /** Full caption under the title (harness · model · extras). */
  readonly agentLabel: string
  readonly status: ParallelGroupLaneStatus
  readonly statusMeta: string
  /** Harness display name for "Message <Harness>" / Send labels. */
  readonly composerName: string
  /** Mapped task for Open task; null when unavailable. */
  readonly taskId: TaskId | null
  readonly prompt: string
  readonly blocks: readonly WorkflowRunLaneBlock[]
  readonly end: ParallelGroupLaneEnd | null
  readonly composer: ParallelGroupLaneComposer
  /** Replace-window history notice; null when absent. */
  readonly historyBoundary: string | null
  /** Body note replacing activity (unavailable / empty). */
  readonly activityNote: string | null
}

export type ParallelGroupObservation = {
  readonly groupId: ParallelGroupId
  readonly title: string
  /** Null when the badge is omitted (empty group). */
  readonly statusLabel: string | null
  readonly badgeTone: ParallelGroupBadgeTone | null
  /** Null when enforcement meta is omitted. */
  readonly enforcementLabel: string | null
  readonly showCancelAll: boolean
  readonly viewPromptEnabled: boolean
  /**
   * Lane min-width floor in points.
   * Legacy `parallel-group/lanes` keeps 320 at a wide main; titled states use 360.
   */
  readonly laneFloorPts: 320 | 360
  readonly lanes: readonly ParallelGroupLane[]
  /** Shown when ready with zero lanes; null uses the unavailable message. */
  readonly emptyMessage: string | null
}

export type ParallelGroupLoad =
  | {
      readonly kind: 'loading'
      /** Skeleton lane count; defaults to 3. Use 2 when the member count is unknown. */
      readonly laneCount?: number
    }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly group: ParallelGroupObservation }

export const PARALLEL_GROUP_UNAVAILABLE = 'This parallel group is unavailable.'

export const PARALLEL_GROUP_EMPTY_MESSAGE =
  'No tasks in this group any more.'
