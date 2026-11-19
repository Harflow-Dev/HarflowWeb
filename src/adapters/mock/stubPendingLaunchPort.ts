import type { EnginePort } from '../../application'
import { asObservationId } from '../../model'
import {
  pendingCapabilityUnsupported,
  pendingInventoryReady,
  pendingStatusLoadFor,
} from './pendingLaunchFixtures'

type PendingObs = Pick<
  EnginePort,
  | 'observeMessagingCapability'
  | 'observePendingLaunchCapability'
  | 'observePendingLaunchInventory'
  | 'observePendingLaunchStatus'
>

/**
 * Pending-launch observations (plus the messaging capability, available) for
 * EnginePort test stubs: capability
 * unsupported, the default inventory, and per-ID default status.
 */
export function stubPendingLaunchPort(): PendingObs {
  return {
    observeMessagingCapability(onUpdate) {
      queueMicrotask(() => onUpdate({ kind: 'ready', supported: true }))
      return {
        id: asObservationId('test-messaging-cap'),
        cancel() {
          /* no-op */
        },
      }
    },
    observePendingLaunchCapability(onUpdate) {
      queueMicrotask(() => onUpdate(pendingCapabilityUnsupported()))
      return {
        id: asObservationId('test-pending-cap'),
        cancel() {
          /* no-op */
        },
      }
    },
    observePendingLaunchInventory(onUpdate) {
      queueMicrotask(() => onUpdate(pendingInventoryReady()))
      return {
        id: asObservationId('test-pending-inv'),
        cancel() {
          /* no-op */
        },
      }
    },
    observePendingLaunchStatus(launchId, onUpdate) {
      queueMicrotask(() => onUpdate(pendingStatusLoadFor(launchId)))
      return {
        id: asObservationId('test-pending-status'),
        cancel() {
          /* no-op */
        },
      }
    },
  }
}
