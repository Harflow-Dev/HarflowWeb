import type {
  PendingLaunchCapabilityLoad,
  PendingLaunchId,
  PendingLaunchInventoryLoad,
  PendingLaunchStatusLoad,
} from '../model'

export type PendingLaunchesScreenState = {
  readonly capability: PendingLaunchCapabilityLoad
  /** Null while the inventory is the selected view. */
  readonly selectedLaunchId: PendingLaunchId | null
  readonly inventory: PendingLaunchInventoryLoad
  readonly status: PendingLaunchStatusLoad
  readonly stopConfirm: boolean
}

export function initialPendingLaunchesState(): PendingLaunchesScreenState {
  return {
    capability: { kind: 'loading' },
    selectedLaunchId: null,
    inventory: { kind: 'loading' },
    status: { kind: 'loading' },
    stopConfirm: false,
  }
}
