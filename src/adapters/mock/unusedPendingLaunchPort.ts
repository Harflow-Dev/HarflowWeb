import type { EnginePort } from '../../application'
import { asObservationId } from '../../model'
import {
  pendingCapabilityUnsupported,
  pendingInventoryReady,
  pendingStatusLoadFor,
} from './pendingLaunchFixtures'

type PendingObs = Pick<
  EnginePort,
  | 'observePendingLaunchCapability'
  | 'observePendingLaunchInventory'
  | 'observePendingLaunchStatus'
>

/** Default unsupported pending observations for EnginePort test stubs. */
export function unusedPendingLaunchPort(
  options?: {
    readonly supported?: boolean
    readonly deferInventory?: boolean
  },
): PendingObs {
  return {
    observePendingLaunchCapability(onUpdate) {
      queueMicrotask(() =>
        onUpdate(
          options?.supported === true
            ? { kind: 'ready', supported: true }
            : pendingCapabilityUnsupported(),
        ),
      )
      return {
        id: asObservationId('test-pending-cap'),
        cancel() {
          /* no-op */
        },
      }
    },
    observePendingLaunchInventory(onUpdate) {
      queueMicrotask(() =>
        onUpdate(
          options?.deferInventory === true
            ? { kind: 'loading' }
            : pendingInventoryReady(),
        ),
      )
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
