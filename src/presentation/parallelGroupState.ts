import type { ParallelGroupId, ParallelGroupLoad } from '../model'

export type ParallelGroupScreenState = {
  readonly groupId: ParallelGroupId | null
  readonly load: ParallelGroupLoad
  /** View prompt revealed in every lane. */
  readonly showPrompt: boolean
  /** Lane id whose actions menu is open; null when closed. */
  readonly openMenuLaneId: string | null
  /** Cancel-all confirmation dialog open. */
  readonly cancelAllConfirm: boolean
  /**
   * Outcome of cancelling a queued message (command result).
   * Not an observation fact; cleared when the route reopens.
   */
  readonly queuedCancelOutcome: string | null
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
