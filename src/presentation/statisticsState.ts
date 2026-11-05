import type { StatisticsLoad, StatisticsRangeId } from '../model'

export type StatisticsScreenState = {
  readonly selectedRange: StatisticsRangeId
  readonly load: StatisticsLoad
}

export function initialStatisticsState(): StatisticsScreenState {
  return {
    selectedRange: '30d',
    load: { kind: 'loading' },
  }
}
