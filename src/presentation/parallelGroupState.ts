import type { ParallelGroupId, ParallelGroupLoad } from '../model'

/**
 * Result of a queued-message command, fenced to the lane it ran in.
 * Not an observation fact.
 */
export type ParallelGroupQueuedOutcome = {
  readonly laneId: string
  readonly kind: 'cancelled'
}

export type ParallelGroupScreenState = {
  readonly groupId: ParallelGroupId | null
  readonly load: ParallelGroupLoad
  /** View prompt revealed in every lane. */
  readonly showPrompt: boolean
  /** Lane id whose actions menu is open; null when closed. */
  readonly openMenuLaneId: string | null
  /** Cancel-all confirmation dialog open. */
  readonly cancelAllConfirm: boolean
  /** Cancelled-message outcome for one lane; cleared when the route reopens. */
  readonly queuedCancelOutcome: ParallelGroupQueuedOutcome | null
}

export function initialParallelGroupState(): ParallelGroupScreenState {
  return {
    groupId: null,
    load: { kind: 'loading', memberCount: null },
    showPrompt: false,
    openMenuLaneId: null,
    cancelAllConfirm: false,
    queuedCancelOutcome: null,
  }
}
