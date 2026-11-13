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
  /** Observed phase; presentation derives the row's status label. */
  readonly phase: PendingLaunchPhase
}

export type PendingLaunchInventoryCoverage = 'complete' | 'incomplete'

export type PendingLaunchInventoryObservation = {
  readonly coverage: PendingLaunchInventoryCoverage
  readonly entries: readonly PendingLaunchInventoryEntry[]
}

export type PendingLaunchInventoryLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable' }
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

export type PendingLaunchStatusObservation = {
  readonly launchId: PendingLaunchId
  readonly phase: PendingLaunchPhase
  /** Null when metadata is not qualified (neutral title). */
  readonly title: string | null
  readonly harness: string | null
  readonly repository: string | null
  /** ISO-8601 UTC timestamp, null when not qualified. */
  readonly createdAt: string | null
  /**
   * Resources the launch requested. Null when not reported; an empty list
   * means none were requested.
   */
  readonly resources: readonly string[] | null
  /** Qualified not-started reason, when phase is not_started. */
  readonly notStartedReason: string | null
  readonly stopSupport: PendingLaunchStopSupport
}

export type PendingLaunchStatusLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'ready'
      readonly status: PendingLaunchStatusObservation
    }

export const PENDING_LAUNCH_CAPABILITY = 'task-pending-launch.v1'
