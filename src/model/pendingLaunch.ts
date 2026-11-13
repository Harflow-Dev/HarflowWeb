import type { PendingLaunchId } from './ids'

/**
 * Pending-launch discovery observations (Design `task-pending-launch.v1`).
 * Mock-only presentation — not a public ctl claim until a real adapter exists.
 */

/** Whether this engine reports the pending-launch capability. */
export type PendingLaunchCapabilityLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly supported: boolean }

/** One inventory row: qualified bounded metadata only. */
export type PendingLaunchInventoryEntry = {
  readonly launchId: PendingLaunchId
  readonly title: string
  readonly harness: string
  readonly repository: string
  /** Short status label shown in the inventory row. */
  readonly statusLabel: string
}

export type PendingLaunchInventoryCoverage = 'complete' | 'incomplete'

export type PendingLaunchInventoryObservation = {
  readonly coverage: PendingLaunchInventoryCoverage
  readonly entries: readonly PendingLaunchInventoryEntry[]
}

export type PendingLaunchInventoryLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | {
      readonly kind: 'ready'
      readonly inventory: PendingLaunchInventoryObservation
    }

/**
 * Observed launch phase from the public status mapping table.
 * Presentation derives headings and copy from these facts.
 */
export type PendingLaunchPhase =
  | 'waiting_for_resources'
  | 'reserved'
  | 'claimed'
  | 'granted'
  | 'not_started'
  | 'unknown'
  | 'not_found'
  | 'recorded'
  | 'recorded_status_unavailable'

/** Stop mechanism support on this launch. */
export type PendingLaunchStopSupport =
  | 'available'
  | 'unavailable'
  | 'none'

/** Observed Stop request outcome when a prior request is shown. */
export type PendingLaunchStopOutcome =
  | 'requested'
  | 'uncertain'
  | 'refused'

export type PendingLaunchStatusObservation = {
  readonly launchId: PendingLaunchId
  readonly phase: PendingLaunchPhase
  /** Null when metadata is not qualified (neutral title). */
  readonly title: string | null
  readonly harness: string | null
  readonly repository: string | null
  readonly createdLabel: string | null
  readonly resourcesLabel: string | null
  /** Qualified not-started reason, when phase is not_started. */
  readonly notStartedReason: string | null
  /** Resources named in the waiting sentence, when waiting. */
  readonly waitingResourcesLabel: string | null
  readonly stopSupport: PendingLaunchStopSupport
  /** Non-null when the fixture shows a prior Stop outcome. */
  readonly stopOutcome: PendingLaunchStopOutcome | null
}

export type PendingLaunchStatusLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | {
      readonly kind: 'ready'
      readonly status: PendingLaunchStatusObservation
    }

export const PENDING_LAUNCH_CAPABILITY = 'task-pending-launch.v1'

export const PENDING_LAUNCH_INVENTORY_UNAVAILABLE =
  'The engine could not be read. Pending launches may still exist.'
