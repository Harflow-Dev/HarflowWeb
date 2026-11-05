import type { ContextLoad, ObservationHandle } from '../model'
import type { EnginePort } from './enginePort'

export type LoadContextUseCase = {
  observe(onUpdate: (load: ContextLoad) => void): ObservationHandle
}

export function createLoadContextUseCase(engine: EnginePort): LoadContextUseCase {
  return {
    observe(onUpdate) {
      return engine.observeContext(onUpdate)
    },
  }
}
