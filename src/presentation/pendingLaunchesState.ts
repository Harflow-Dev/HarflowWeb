import type {
  PendingLaunchCapabilityLoad,
  PendingLaunchId,
  PendingLaunchInventoryLoad,
  PendingLaunchStatusLoad,
} from '../model'

/**
 * Result of a prior Stop request. This belongs to the cancel command, not to
 * the launch status observation; the mock seeds it for the Stop scenarios.
 */
export type PendingLaunchStopOutcome = 'requested' | 'uncertain' | 'refused'

export type PendingLaunchesScreenState = {
  readonly capability: PendingLaunchCapabilityLoad
  /** Null while the inventory is the selected view. */
  readonly selectedLaunchId: PendingLaunchId | null
  readonly inventory: PendingLaunchInventoryLoad
  readonly status: PendingLaunchStatusLoad
  readonly stopConfirm: boolean
  readonly stopOutcome: PendingLaunchStopOutcome | null
}

export function initialPendingLaunchesState(): PendingLaunchesScreenState {
  return {
    capability: { kind: 'loading' },
    selectedLaunchId: null,
    inventory: { kind: 'loading' },
    status: { kind: 'loading' },
    stopConfirm: false,
    stopOutcome: null,
  }
}
