import type {
  ParallelGroupLane,
  ParallelGroupLoad,
  ParallelGroupObservation,
} from '../model'
import type { ParallelGroupScreenState } from './parallelGroupState'

/** Approved copy for a group that no longer has any lane (Design 2153ab1). */
export const PARALLEL_GROUP_EMPTY_MESSAGE = 'No tasks in this group any more.'

/** Skeleton lane count while the member count is unknown. */
export const PARALLEL_GROUP_UNKNOWN_LANE_COUNT = 2

/** Badge tint for the group top bar. */
export type ParallelGroupBadgeTone = 'running' | 'done' | 'failed' | 'neutral'

/** Top-bar state derived from the observed lane statuses. */
export type ParallelGroupTopBar = {
  /** Null when the group has no lanes. */
  readonly badgeTone: ParallelGroupBadgeTone | null
  /** Cancel all is offered only while a lane is running. */
  readonly showCancelAll: boolean
  /** View prompt needs at least one lane with a stored prompt. */
  readonly viewPromptEnabled: boolean
  /**
   * Lanes without stored prompts keep the earlier harness-titled specimen
   * layout (320pt floor at a wide main column).
   */
  readonly harnessTitled: boolean
}

function badgeTone(
  lanes: readonly ParallelGroupLane[],
): ParallelGroupBadgeTone | null {
  if (lanes.length === 0) return null
  const has = (status: ParallelGroupLane['status']): boolean =>
    lanes.some((lane) => lane.status === status)
  if (has('running')) return 'running'
  if (has('failed')) return 'failed'
  if (has('cancelled') || has('pending')) return 'neutral'
  return 'done'
}

export function parallelGroupTopBar(
  group: ParallelGroupObservation,
): ParallelGroupTopBar {
  const withPrompt = group.lanes.some((lane) => lane.prompt !== '')
  return {
    badgeTone: badgeTone(group.lanes),
    showCancelAll: group.lanes.some((lane) => lane.status === 'running'),
    viewPromptEnabled: withPrompt,
    harnessTitled: group.lanes.length > 0 && !withPrompt,
  }
}

/** Skeleton lane count for a loading Parallel group: unknown shows two. */
export function parallelGroupSkeletonLanes(
  load: Extract<ParallelGroupLoad, { kind: 'loading' }>,
): number {
  return load.memberCount ?? PARALLEL_GROUP_UNKNOWN_LANE_COUNT
}

/** The Cancel-all dialog covers the whole app only for a ready, cancellable group. */
export function cancelAllDialogOpen(state: ParallelGroupScreenState): boolean {
  return (
    state.cancelAllConfirm &&
    state.load.kind === 'ready' &&
    parallelGroupTopBar(state.load.group).showCancelAll
  )
}
