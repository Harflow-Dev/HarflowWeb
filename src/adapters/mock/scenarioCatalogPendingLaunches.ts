import type { PendingLaunchInventoryLoad } from '../../model'
import {
  PENDING_LAUNCH_A,
  PENDING_LAUNCH_B,
  pendingInventoryEmpty,
  pendingInventoryFailed,
  pendingInventoryIncomplete,
  pendingInventoryReady,
  type PendingLaunchStatusFixtureId,
} from './pendingLaunchFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'

function pendingSeed(options?: {
  readonly launchId?: string
  readonly stopConfirm?: boolean
  readonly frame?: 'minimum'
}): NonNullable<ScenarioDefinition['seed']> {
  return {
    openPendingLaunches: true,
    ...(options?.launchId !== undefined
      ? { openPendingLaunchId: options.launchId }
      : {}),
    ...(options?.stopConfirm === true
      ? { pendingLaunchStopConfirm: true }
      : {}),
    ...(options?.frame === 'minimum' ? { frame: 'minimum' as const } : {}),
  }
}

function detail(
  id: ScenarioIdLike,
  label: string,
  description: string,
  status: PendingLaunchStatusFixtureId,
  launchId: string,
  extra?: { readonly stopConfirm?: boolean; readonly frame?: 'minimum' },
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    pendingLaunchCapability: true,
    pendingLaunchInventory: pendingInventoryReady(),
    pendingLaunchStatus: status,
    seed: pendingSeed({
      launchId,
      ...(extra?.stopConfirm === true ? { stopConfirm: true } : {}),
      ...(extra?.frame === 'minimum' ? { frame: 'minimum' as const } : {}),
    }),
  })
}

type ScenarioIdLike = ScenarioDefinition['id']

function inventory(
  id: ScenarioIdLike,
  label: string,
  description: string,
  inventoryLoad: PendingLaunchInventoryLoad | 'defer',
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    pendingLaunchCapability: true,
    pendingLaunchInventory: inventoryLoad,
    seed: pendingSeed(),
  })
}

/**
 * Approved task/pending-* states (Design 83d820f).
 * Capability is on for these scenarios only; other scenarios hide the nav item.
 */
export const PENDING_LAUNCH_SCENARIOS: readonly ScenarioDefinition[] = [
  inventory(
    'pending-launches-inventory',
    'Pending launches · Inventory',
    'Approved task/pending-inventory (Design 83d820f).',
    pendingInventoryReady(),
  ),
  inventory(
    'pending-launches-loading',
    'Pending launches · Loading',
    'Approved task/pending-loading (Design 83d820f). Deferred inventory.',
    'defer',
  ),
  inventory(
    'pending-launches-empty',
    'Pending launches · Empty',
    'Approved task/pending-empty (Design 83d820f).',
    pendingInventoryEmpty(),
  ),
  inventory(
    'pending-launches-failed',
    'Pending launches · Failed',
    'Approved task/pending-failed (Design 83d820f).',
    pendingInventoryFailed(),
  ),
  inventory(
    'pending-launches-incomplete',
    'Pending launches · Incomplete',
    'Approved task/pending-incomplete (Design 83d820f).',
    pendingInventoryIncomplete(),
  ),
  detail(
    'pending-launches-waiting',
    'Pending launches · Waiting',
    'Approved task/pending-waiting (Design 83d820f).',
    'waiting',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-preparing',
    'Pending launches · Preparing',
    'Approved task/pending-preparing (Design 83d820f).',
    'preparing',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-preparing-handshake',
    'Pending launches · Preparing handshake',
    'Approved task/pending-preparing-handshake (Design 83d820f).',
    'preparing-handshake',
    PENDING_LAUNCH_B,
  ),
  detail(
    'pending-launches-granted',
    'Pending launches · Granted',
    'Approved task/pending-granted (Design 83d820f).',
    'granted',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-not-started',
    'Pending launches · Not started',
    'Approved task/pending-not-started (Design 83d820f).',
    'not-started',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-unavailable',
    'Pending launches · Unavailable',
    'Approved task/pending-unavailable (Design 83d820f).',
    'unavailable',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-missing',
    'Pending launches · Missing',
    'Approved task/pending-missing (Design 83d820f).',
    'missing',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-recorded',
    'Pending launches · Recorded',
    'Approved task/pending-recorded (Design 83d820f).',
    'recorded',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-handoff-failed',
    'Pending launches · Handoff failed',
    'Approved task/pending-handoff-failed (Design 83d820f).',
    'handoff-failed',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-stop-confirm',
    'Pending launches · Stop confirm',
    'Approved task/pending-stop-confirm (Design 83d820f).',
    'waiting',
    PENDING_LAUNCH_A,
    { stopConfirm: true },
  ),
  detail(
    'pending-launches-stop-requested',
    'Pending launches · Stop requested',
    'Approved task/pending-stop-requested (Design 83d820f).',
    'stop-requested',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-stop-uncertain',
    'Pending launches · Stop uncertain',
    'Approved task/pending-stop-uncertain (Design 83d820f).',
    'stop-uncertain',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-stop-refused',
    'Pending launches · Stop refused',
    'Approved task/pending-stop-refused (Design 83d820f).',
    'stop-refused',
    PENDING_LAUNCH_A,
  ),
  detail(
    'pending-launches-waiting-minimum',
    'Pending launches · Waiting · 1000×620',
    'Approved task/pending-waiting-minimum (Design 83d820f).',
    'waiting',
    PENDING_LAUNCH_A,
    { frame: 'minimum' },
  ),
  detail(
    'pending-launches-stop-confirm-minimum',
    'Pending launches · Stop confirm · 1000×620',
    'Approved task/pending-stop-confirm-minimum (Design 83d820f).',
    'waiting',
    PENDING_LAUNCH_A,
    { stopConfirm: true, frame: 'minimum' },
  ),
  detail(
    'pending-launches-stop-requested-minimum',
    'Pending launches · Stop requested · 1000×620',
    'Approved task/pending-stop-requested-minimum (Design 83d820f).',
    'stop-requested',
    PENDING_LAUNCH_A,
    { frame: 'minimum' },
  ),
]
