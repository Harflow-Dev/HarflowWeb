import type { ObservationHandle, ResourcesLoad } from '../model'
import type { EnginePort } from './enginePort'

export type LoadResourcesUseCase = {
  observe(onUpdate: (load: ResourcesLoad) => void): ObservationHandle
}

export function createLoadResourcesUseCase(
  engine: EnginePort,
): LoadResourcesUseCase {
  return {
    observe(onUpdate) {
      return engine.observeResources(onUpdate)
    },
  }
}
