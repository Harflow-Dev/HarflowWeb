import type {
  PendingLaunchCapabilityLoad,
  PendingLaunchId,
  PendingLaunchInventoryLoad,
  PendingLaunchStatusLoad,
} from '../../model'
import { createObservation, createKeyedObservation } from './mockObservation'
import {
  pendingCapabilitySupported,
  pendingCapabilityUnsupported,
  pendingInventoryReady,
  pendingStatusLoadFor,
} from './pendingLaunchFixtures'
import type { MockEngineObserveOptions } from './mockEngineObserve'

export function mockObservePendingSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observePendingLaunchCapability(
      onUpdate: (load: PendingLaunchCapabilityLoad) => void,
    ) {
      return createObservation(listeners.pendingCapability, onUpdate, () => {
        const scenario = getScenario()
        if (scenario.pendingLaunchCapability === 'defer') {
          return { kind: 'loading' as const }
        }
        return scenario.pendingLaunchCapability
          ? pendingCapabilitySupported()
          : pendingCapabilityUnsupported()
      })
    },
    observePendingLaunchInventory(
      onUpdate: (load: PendingLaunchInventoryLoad) => void,
    ) {
      return createObservation(listeners.pendingInventory, onUpdate, () => {
        const scenario = getScenario()
        if (scenario.pendingLaunchInventory === 'defer') {
          return { kind: 'loading' as const }
        }
        return scenario.pendingLaunchInventory === 'default'
          ? pendingInventoryReady()
          : scenario.pendingLaunchInventory
      })
    },
    observePendingLaunchStatus(
      launchId: PendingLaunchId,
      onUpdate: (load: PendingLaunchStatusLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.pendingStatus,
        launchId,
        onUpdate,
        (id): PendingLaunchStatusLoad => {
          const scenario = getScenario()
          return pendingStatusLoadFor(
            id,
            scenario.pendingLaunchStatus,
            scenario.seed?.openPendingLaunchId,
          )
        },
      )
    },
  }
}