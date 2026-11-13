import {
  asPendingLaunchId,
  type PendingLaunchCapabilityLoad,
  type PendingLaunchId,
  type PendingLaunchInventoryLoad,
  type PendingLaunchInventoryEntry,
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

const CREATED = '2026-11-10T09:30:00Z'
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
  const entries: PendingLaunchInventoryEntry[] = [
    {
      launchId: PENDING_LAUNCH_A,
      title: 'Review launch admission checks',
      harness: 'Claude',
      repository: 'Harflow',
      phase: 'waiting_for_resources' as const,
    },
  ]
  if (includeSecond) {
    entries.push({
      launchId: PENDING_LAUNCH_B,
      title: 'Prepare local environment',
      harness: 'Codex',
      repository: 'Harflow',
      phase: 'claimed' as const,
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
  return { kind: 'unavailable' }
}

function baseStatus(
  partial: Partial<PendingLaunchStatusObservation> &
    Pick<PendingLaunchStatusObservation, 'launchId' | 'phase'>,
): PendingLaunchStatusObservation {
  return {
    title: 'Review launch admission checks',
    harness: 'Claude',
    repository: REPO,
    createdAt: CREATED,
    resources: ['Claude slots', 'Shared checkout'],
    notStartedReason: null,
    stopSupport: 'none',
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
    resources: [],
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
    createdAt: null,
    resources: null,
    stopSupport: 'none',
  })
}

export function pendingStatusMissing(
  launchId: PendingLaunchId = PENDING_LAUNCH_A,
): PendingLaunchStatusObservation {
  return baseStatus({
    launchId,
    phase: 'not_found',
    title: null,
    harness: null,
    repository: null,
    createdAt: null,
    resources: null,
    stopSupport: 'none',
  })
}

export function pendingStatusRecorded(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'recorded',
    title: null,
    harness: null,
    repository: null,
    createdAt: null,
    resources: null,
    stopSupport: 'none',
  })
}

export function pendingStatusHandoffFailed(): PendingLaunchStatusObservation {
  return baseStatus({
    launchId: PENDING_LAUNCH_A,
    phase: 'recorded_status_unavailable',
    title: null,
    harness: null,
    repository: null,
    createdAt: null,
    resources: null,
    stopSupport: 'none',
  })
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
}

export function pendingStatusFixture(
  id: PendingLaunchStatusFixtureId,
): PendingLaunchStatusObservation {
  return STATUS_FIXTURES[id]
}

/**
 * Status load for one requested ID. A scenario's fixture override applies
 * only to the ID the scenario seeds; every other ID keeps its own default
 * status, so a read never answers with another launch's data.
 */
export function pendingStatusLoadFor(
  launchId: PendingLaunchId,
  setting: PendingLaunchStatusFixtureId | 'default' | 'defer' = 'default',
  seededId?: string,
): PendingLaunchStatusLoad {
  if (setting === 'defer') return { kind: 'loading' }
  if (setting !== 'default' && launchId === seededId) {
    return { kind: 'ready', status: pendingStatusFixture(setting) }
  }
  const status = STATUS_BY_ID.get(launchId)
  return {
    kind: 'ready',
    status: status ?? pendingStatusMissing(launchId),
  }
}
