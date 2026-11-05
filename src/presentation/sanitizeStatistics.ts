import type {
  HarnessStatisticsRow,
  MedianDuration,
  StatisticsLoad,
  StatisticsObservation,
  SuccessRateMetric,
} from '../model'

const INCOMPLETE_SUCCESS: SuccessRateMetric = {
  kind: 'suppressed',
  reason: 'Incomplete population; success rate not computed.',
}

const INCOMPLETE_MEDIAN: MedianDuration = {
  kind: 'suppressed',
  reason: 'Incomplete population; median not computed.',
}

/**
 * Presentation invariant: incomplete populations never surface reported
 * success rates or median durations, even if a type-valid observation
 * carries them. Cost and task counts are left unchanged (unknown ≠ zero).
 */
export function sanitizeStatisticsLoad(load: StatisticsLoad): StatisticsLoad {
  if (load.kind !== 'ready') return load
  return {
    kind: 'ready',
    observation: sanitizeStatisticsObservation(load.observation),
  }
}

export function sanitizeStatisticsObservation(
  observation: StatisticsObservation,
): StatisticsObservation {
  if (observation.coverage.kind !== 'incomplete') return observation
  return {
    ...observation,
    successRate: suppressSuccess(observation.successRate),
    byHarness: observation.byHarness.map(suppressHarnessDerived),
  }
}

function suppressSuccess(metric: SuccessRateMetric): SuccessRateMetric {
  if (metric.kind === 'suppressed') return metric
  return INCOMPLETE_SUCCESS
}

function suppressHarnessDerived(
  row: HarnessStatisticsRow,
): HarnessStatisticsRow {
  return {
    ...row,
    successRate: suppressSuccess(row.successRate),
    medianDuration:
      row.medianDuration.kind === 'suppressed'
        ? row.medianDuration
        : INCOMPLETE_MEDIAN,
  }
}
