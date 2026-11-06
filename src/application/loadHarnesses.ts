import type { HarnessesLoad, ObservationHandle } from '../model'
import type { EnginePort } from './enginePort'

export type LoadHarnessesUseCase = {
  observe(onUpdate: (load: HarnessesLoad) => void): ObservationHandle
}

export function createLoadHarnessesUseCase(
  engine: EnginePort,
): LoadHarnessesUseCase {
  return {
    observe(onUpdate) {
      return engine.observeHarnesses(onUpdate)
    },
  }
}
