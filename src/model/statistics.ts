import type { HarnessId } from './ids'

/** Approved range selector ids from statistics/overview. */
export type StatisticsRangeId = '7d' | '30d' | 'all'

export const STATISTICS_RANGES: readonly {
  readonly id: StatisticsRangeId
  readonly label: string
}[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
]

/**
 * Completeness of the observed population for this range.
 * Derived metrics (success rate, median duration) are only admitted when complete.
 */
export type StatisticsCoverage =
  | { readonly kind: 'complete' }
  | { readonly kind: 'incomplete'; readonly reason: string }

/** Fixture-reported cost: observed zero is distinct from unavailable/missing. */
export type ReportedCost =
  | { readonly kind: 'reported'; readonly amountUsd: number }
  | { readonly kind: 'unavailable' }

/**
 * Success rate is a fixture fact for complete populations only.
 * Never compute from incomplete counts in presentation.
 */
export type SuccessRateMetric =
  | {
      readonly kind: 'reported'
      readonly percent: number
      readonly failedCount: number
      readonly caption: string
    }
  | { readonly kind: 'suppressed'; readonly reason: string }

export type AgentTimeMetric =
  | {
      readonly kind: 'reported'
      readonly display: string
      readonly caption: string
    }
  | { readonly kind: 'unknown' }

export type CostHeadline =
  | {
      readonly kind: 'reported'
      readonly amountUsd: number
      readonly caption: string
    }
  | {
      readonly kind: 'partial'
      readonly amountUsd: number
      readonly caption: string
    }
  | { readonly kind: 'unavailable'; readonly caption: string }

export type DailyTaskBucket = {
  readonly dateLabel: string
  readonly done: number
  readonly failed: number
}

export type MedianDuration =
  | { readonly kind: 'reported'; readonly display: string }
  | { readonly kind: 'suppressed'; readonly reason: string }

export type HarnessStatisticsRow = {
  readonly harnessId: HarnessId
  /** Fixture presentation label — not an installed/qualified backend claim. */
  readonly label: string
  readonly tasks: number
  readonly successRate: SuccessRateMetric
  readonly medianDuration: MedianDuration
  readonly cost: ReportedCost
}

export type StatisticsObservation = {
  readonly range: StatisticsRangeId
  readonly rangeLabel: string
  readonly coverage: StatisticsCoverage
  /** Where these mock numbers come from (design specimen / retained window). */
  readonly provenance: string
  readonly units: {
    readonly tasks: 'count'
    readonly duration: 'display-string'
    readonly cost: 'usd'
  }
  readonly tasksRun: number
  readonly tasksRunCaption: string
  readonly successRate: SuccessRateMetric
  readonly agentTime: AgentTimeMetric
  readonly reportedCost: CostHeadline
  readonly chartScaleMax: number
  readonly daily: readonly DailyTaskBucket[]
  readonly chartAxisStart: string
  readonly chartAxisMid: string
  readonly chartAxisEnd: string
  readonly byHarness: readonly HarnessStatisticsRow[]
}

export type StatisticsLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | {
      readonly kind: 'ready'
      readonly observation: StatisticsObservation
    }
