import type { ParallelGroupId, ParallelGroupLoad } from '../model'

export type ParallelGroupScreenState = {
  readonly groupId: ParallelGroupId | null
  readonly load: ParallelGroupLoad
}

export function initialParallelGroupState(): ParallelGroupScreenState {
  return {
    groupId: null,
    load: { kind: 'loading' },
  }
}
