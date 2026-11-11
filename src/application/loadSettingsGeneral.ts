import type { ObservationHandle, SettingsGeneralLoad } from '../model'
import type { EnginePort } from './enginePort'

export type LoadSettingsGeneralUseCase = {
  observe(onUpdate: (load: SettingsGeneralLoad) => void): ObservationHandle
}

export function createLoadSettingsGeneralUseCase(
  engine: EnginePort,
): LoadSettingsGeneralUseCase {
  return {
    observe(onUpdate) {
      return engine.observeSettingsGeneral(onUpdate)
    },
  }
}
