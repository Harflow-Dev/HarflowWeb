import type {
  ObservationHandle,
  PendingLaunchCapabilityLoad,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadPendingLaunchCapabilityUseCase = {
  observe(
    onUpdate: (load: PendingLaunchCapabilityLoad) => void,
  ): ObservationHandle
}

export function createLoadPendingLaunchCapabilityUseCase(
  engine: EnginePort,
): LoadPendingLaunchCapabilityUseCase {
  return {
    observe(onUpdate) {
      return engine.observePendingLaunchCapability(onUpdate)
    },
  }
}
