import {
  asPendingLaunchId,
  PENDING_LAUNCH_INVENTORY_UNAVAILABLE,
  type PendingLaunchCapabilityLoad,
  type PendingLaunchId,
  type PendingLaunchInventoryLoad,
  type PendingLaunchInventoryObservation,
  type PendingLaunchStatusLoad,
  type PendingLaunchStatusObservation,
} from '../../model'

/**
 * Pending-launch fixtures.
 * Design pin: HarflowDesign `83d820f57e6ec2d82cccd3a1e335128332fdb672`
 * (`v2/scripts/screens-pending-launches.js`).
 */

export const PENDING_LAUNCH_A = asPendingLaunchId('20261110-093000-a17c92')
export const PENDING_LAUNCH_B = asPendingLaunchId('20261110-093200-b28d03')

const CREATED = '10 Nov 2026, 09:30'
const REPO = '/projects/Harflow'

export function pendingCapabilityUnsupported(): PendingLaunchCapabilityLoad {
  return { kind: 'ready', supported: false }
}

export function pendingCapabilitySupported(): PendingLaunchCapabilityLoad {
  return { kind: 'ready', supported: true }
}

function inventoryObservation(
  coverage: PendingLaunchInventoryObservation['coverage'],
  includeSecond = true,
): PendingLaunchInventoryObservation {
  const entries = [
    {
      launchId: PENDING_LAUNCH_A,
      title: 'Review launch admission checks',
      harness: 'Claude',
      repository: 'Harflow',
      statusLabel: 'Waiting for resources',
    },
  ]
  if (includeSecond) {
    entries.push({
      launchId: PENDING_LAUNCH_B,
      title: 'Prepare local environment',
      harness: 'Codex',
      repository: 'Harflow',
      statusLabel: 'Preparing',
    })
  }
  return { coverage, entries }
}

export function pendingInventoryReady(): PendingLaunchInventoryLoad {
  return { kind: 'ready', inventory: inventoryObservation('complete') }
}

export function pendingInventoryEmpty(): PendingLaunchInventoryLoad {
  return {
    kind: 'ready',
    inventory: { coverage: 'complete', entries: [] },
  }
}

export function pendingInventoryIncomplete(): PendingLaunchInventoryLoad {
  return { kind: 'ready', inventory: inventoryObservation('incomplete') }
}

export function pendingInventoryFailed(): PendingLaunchInventoryLoad {
  return {
    kind: 'unavailable',
    message: PENDING_LAUNCH_INVENTORY_UNAVAILABLE,
  }
}

function baseStatus(
  partial: Partial<PendingLaunchStatusObservation> &
    Pick<PendingLaunchStatusObservation, 'launchId' | 'phase'>,
): PendingLaunchStatusObservation {
  return {
    title: 'Review launch admission checks',
    harness: 'Claude',
    repository: REPO,
    createdLabel: CREATED,
    resourcesLabel: 'Claude slots · Shared checkout',
    notStartedReason: null,
    waitingResourcesLabel: 'Claude slots and Shared checkout',
    stopSupport: 'none',
    stopOutcome: null,
    ...partial,
  }
}

export function pendingStatusWaiting(
  launchId: PendingLaunchId = PENDING_LAUNCH_A,
): PendingLaunchStatusObservation {
  return baseStatus({
    launchId,
    phase: 'waiting_for_resources',
    stopSupport: 'available',
  })
}

export function pendingStatusPreparing(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'reserved',
    stopSupport: 'available',
  })
}

export function pendingStatusPreparingHandshake(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_B,
    phase: 'claimed',
    title: 'Prepare local environment',
    harness: 'Codex',
    resourcesLabel: 'None requested',
    waitingResourcesLabel: null,
    stopSupport: 'unavailable',
  })
}

export function pendingStatusGranted(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'granted',
    stopSupport: 'available',
  })
}

export function pendingStatusNotStarted(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'not_started',
    notStartedReason: 'resource wait was cancelled',
    stopSupport: 'none',
  })
}

export function pendingStatusUnavailable(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'unknown',
    title: null,
    harness: null,
    repository: null,
    createdLabel: null,
    resourcesLabel: null,
    waitingResourcesLabel: null,
    stopSupport: 'none',
  })
}

export function pendingStatusMissing(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'not_found',
    title: null,
    harness: null,
    repository: null,
    createdLabel: null,
    resourcesLabel: null,
    waitingResourcesLabel: null,
    stopSupport: 'none',
  })
}

export function pendingStatusRecorded(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'recorded',
    stopSupport: 'none',
  })
}

export function pendingStatusHandoffFailed(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'recorded_status_unavailable',
    stopSupport: 'none',
  })
}

export function pendingStatusStopRequested(): PendingLaunchStatusObservation {
  return {
    ...pendingStatusWaiting(),
    stopOutcome: 'requested',
    stopSupport: 'none',
  }
}

export function pendingStatusStopUncertain(): PendingLaunchStatusObservation {
  return {
    ...pendingStatusWaiting(),
    stopOutcome: 'uncertain',
    stopSupport: 'none',
  }
}

export function pendingStatusStopRefused(): PendingLaunchStatusObservation {
  return {
    ...pendingStatusWaiting(),
    stopOutcome: 'refused',
    stopSupport: 'none',
  }
}

const STATUS_BY_ID = new Map<PendingLaunchId, PendingLaunchStatusObservation>([
  [PENDING_LAUNCH_A, pendingStatusWaiting()],
  [PENDING_LAUNCH_B, pendingStatusPreparingHandshake()],
])

export type PendingLaunchStatusFixtureId =
  | 'waiting'
  | 'preparing'
  | 'preparing-handshake'
  | 'granted'
  | 'not-started'
  | 'unavailable'
  | 'missing'
  | 'recorded'
  | 'handoff-failed'
  | 'stop-requested'
  | 'stop-uncertain'
  | 'stop-refused'

const STATUS_FIXTURES: Record<
  PendingLaunchStatusFixtureId,
  PendingLaunchStatusObservation
> = {
  waiting: pendingStatusWaiting(),
  preparing: pendingStatusPreparing(),
  'preparing-handshake': pendingStatusPreparingHandshake(),
  granted: pendingStatusGranted(),
  'not-started': pendingStatusNotStarted(),
  unavailable: pendingStatusUnavailable(),
  missing: pendingStatusMissing(),
  recorded: pendingStatusRecorded(),
  'handoff-failed': pendingStatusHandoffFailed(),
  'stop-requested': pendingStatusStopRequested(),
  'stop-uncertain': pendingStatusStopUncertain(),
  'stop-refused': pendingStatusStopRefused(),
}

export function pendingStatusFixture(
  id: PendingLaunchStatusFixtureId,
): PendingLaunchStatusObservation {
  return STATUS_FIXTURES[id]
}

export function pendingStatusLoadFor(
  launchId: PendingLaunchId,
  override: PendingLaunchStatusFixtureId | 'default' | 'defer' = 'default',
): PendingLaunchStatusLoad {
  if (override === 'defer') return { kind: 'loading' }
  if (override !== 'default') {
    return { kind: 'ready', status: pendingStatusFixture(override) }
  }
  const status = STATUS_BY_ID.get(launchId)
  if (!status) {
    return {
      kind: 'ready',
      status: pendingStatusMissing(),
    }
  }
  return { kind: 'ready', status }
}
