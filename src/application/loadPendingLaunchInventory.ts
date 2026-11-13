import type {
  ObservationHandle,
  PendingLaunchInventoryLoad,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadPendingLaunchInventoryUseCase = {
  observe(
    onUpdate: (load: PendingLaunchInventoryLoad) => void,
  ): ObservationHandle
}

export function createLoadPendingLaunchInventoryUseCase(
  engine: EnginePort,
): LoadPendingLaunchInventoryUseCase {
  return {
    observe(onUpdate) {
      return engine.observePendingLaunchInventory(onUpdate)
    },
  }
}
