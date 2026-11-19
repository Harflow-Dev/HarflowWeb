import type { MessagingCapabilityLoad, ObservationHandle } from '../model'
import type { EnginePort } from './enginePort'

export type LoadMessagingCapabilityUseCase = {
  observe(onUpdate: (load: MessagingCapabilityLoad) => void): ObservationHandle
}

export function createLoadMessagingCapabilityUseCase(
  engine: EnginePort,
): LoadMessagingCapabilityUseCase {
  return {
    observe(onUpdate) {
      return engine.observeMessagingCapability(onUpdate)
    },
  }
}
