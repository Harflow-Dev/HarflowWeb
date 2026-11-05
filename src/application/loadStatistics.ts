import type {
  ObservationHandle,
  StatisticsLoad,
  StatisticsRangeId,
} from '../model'
import type { EnginePort } from './enginePort'

export type LoadStatisticsUseCase = {
  observe(
    range: StatisticsRangeId,
    onUpdate: (load: StatisticsLoad) => void,
  ): ObservationHandle
}

export function createLoadStatisticsUseCase(
  engine: EnginePort,
): LoadStatisticsUseCase {
  return {
    observe(range, onUpdate) {
      return engine.observeStatistics(range, onUpdate)
    },
  }
}
