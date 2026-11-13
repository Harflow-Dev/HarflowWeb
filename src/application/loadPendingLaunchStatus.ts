import type {
  ObservationHandle,
  PendingLaunchId,
  PendingLaunchStatusLoad,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadPendingLaunchStatusUseCase = {
  observe(
    launchId: PendingLaunchId,
    onUpdate: (load: PendingLaunchStatusLoad) => void,
  ): ObservationHandle
}

export function createLoadPendingLaunchStatusUseCase(
  engine: EnginePort,
): LoadPendingLaunchStatusUseCase {
  return {
    observe(launchId, onUpdate) {
      return engine.observePendingLaunchStatus(launchId, onUpdate)
    },
  }
}
