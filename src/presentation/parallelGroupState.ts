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
}

export function initialParallelGroupState(): ParallelGroupScreenState {
  return {
    groupId: null,
    load: { kind: 'loading', memberCount: null },
    showPrompt: false,
    openMenuLaneId: null,
    cancelAllConfirm: false,
  }
}
