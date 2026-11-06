import type { NeedsYouLoad, ObservationHandle } from '../model'
import type { EnginePort } from './enginePort'

export type LoadNeedsYouUseCase = {
  observe(onUpdate: (load: NeedsYouLoad) => void): ObservationHandle
}

export function createLoadNeedsYouUseCase(
  engine: EnginePort,
): LoadNeedsYouUseCase {
  return {
    observe(onUpdate) {
      return engine.observeNeedsYou(onUpdate)
    },
  }
}
