/**
 * Deterministic statistics fixtures from HarflowDesign
 * 3643d083… v2/scripts/screens-statistics.js state statistics/overview.
 * Mock-only presentation — not a public ctl statistics catalog.
 */
import type {
  DailyTaskBucket,
  HarnessStatisticsRow,
  StatisticsLoad,
  StatisticsObservation,
  StatisticsRangeId,
} from '../../model'
import {
  daily30d,
  daily7d,
  harnessRows30d,
  harnessRows7d,
  reportedSuccess,
} from './statisticsSeries'

const PROVENANCE_30D =
  'Mock fixture aligned to HarflowDesign statistics/overview (30-day specimen).'

const PROVENANCE_7D =
  'Mock fixture for the 7-day range; distinct totals from the 30-day specimen.'

const PROVENANCE_ALL =
  'Mock retained-history window only — not all-time engine history.'

function sumDaily(daily: readonly DailyTaskBucket[]): {
  tasks: number
  failed: number
} {
  let tasks = 0
  let failed = 0
  for (const bucket of daily) {
    tasks += bucket.done + bucket.failed
    failed += bucket.failed
  }
  return { tasks, failed }
}

function successFromPopulation(tasks: number, failed: number) {
  const percent = tasks === 0 ? 0 : Math.round(((tasks - failed) / tasks) * 100)
  return reportedSuccess(percent, failed, `${failed} failed`)
}

function completeObservation(args: {
  readonly range: '7d' | '30d'
  readonly rangeLabel: string
  readonly provenance: string
  readonly tasksRunCaption: string
  readonly daily: readonly DailyTaskBucket[]
  readonly byHarness: readonly HarnessStatisticsRow[]
  readonly agentTimeDisplay: string
  readonly reportedCost: StatisticsObservation['reportedCost']
  readonly chartAxisStart: string
  readonly chartAxisMid: string
  readonly chartAxisEnd: string
}): StatisticsObservation {
  const population = sumDaily(args.daily)
  return {
    range: args.range,
    rangeLabel: args.rangeLabel,
    coverage: { kind: 'complete' },
    provenance: args.provenance,
    units: { tasks: 'count', duration: 'display-string', cost: 'usd' },
    tasksRun: population.tasks,
    tasksRunCaption: args.tasksRunCaption,
    successRate: successFromPopulation(population.tasks, population.failed),
    agentTime: {
      kind: 'reported',
      display: args.agentTimeDisplay,
      caption: 'summed across tasks',
    },
    reportedCost: args.reportedCost,
    chartScaleMax: 20,
    daily: args.daily,
    chartAxisStart: args.chartAxisStart,
    chartAxisMid: args.chartAxisMid,
    chartAxisEnd: args.chartAxisEnd,
    byHarness: args.byHarness,
  }
}

function observation30d(): StatisticsObservation {
  return completeObservation({
    range: '30d',
    rangeLabel: '30 days',
    provenance: PROVENANCE_30D,
    tasksRunCaption: 'Last 30 days',
    daily: daily30d(),
    byHarness: harnessRows30d(),
    agentTimeDisplay: '41:12:05',
    reportedCost: {
      kind: 'partial',
      amountUsd: 182.4,
      caption: "as reported by harness; 3 harnesses don't report cost",
    },
    chartAxisStart: 'Oct 5',
    chartAxisMid: 'Oct 20',
    chartAxisEnd: 'Nov 3',
  })
}

function observation7d(): StatisticsObservation {
  return completeObservation({
    range: '7d',
    rangeLabel: '7 days',
    provenance: PROVENANCE_7D,
    tasksRunCaption: 'Last 7 days',
    daily: daily7d(),
    byHarness: harnessRows7d(),
    agentTimeDisplay: '09:48:22',
    reportedCost: {
      kind: 'partial',
      amountUsd: 42.1,
      caption: 'as reported by harness; some harnesses do not report cost',
    },
    chartAxisStart: 'Oct 28',
    chartAxisMid: 'Oct 31',
    chartAxisEnd: 'Nov 3',
  })
}

/**
 * Selecting "All time" must not present retained history as all-time.
 * Incomplete coverage is enforced again in presentation sanitization.
 * This fixture deliberately keeps reported harness metrics so sanitization
 * is not fixture-dependent; session tests also supply a worse case.
 */
function observationAllRetained(): StatisticsObservation {
  const retained = observation30d()
  return {
    ...retained,
    range: 'all',
    rangeLabel: 'All time',
    coverage: {
      kind: 'incomplete',
      reason:
        'Retained mock history is a bounded window, not all-time engine history.',
    },
    provenance: PROVENANCE_ALL,
    tasksRun: 412,
    tasksRunCaption: 'Retained history (not all-time)',
    // Intentionally leave reported success/median from retained rows —
    // presentation must suppress them for incomplete coverage.
    agentTime: { kind: 'unknown' },
    reportedCost: {
      kind: 'unavailable',
      caption: 'Cost coverage incomplete for the retained window',
    },
  }
}

export function statisticsObservationFor(
  range: StatisticsRangeId,
): StatisticsObservation {
  if (range === '7d') return observation7d()
  if (range === 'all') return observationAllRetained()
  return observation30d()
}

export function statisticsLoadFor(range: StatisticsRangeId): StatisticsLoad {
  return { kind: 'ready', observation: statisticsObservationFor(range) }
}

export function populatedStatisticsLoad(): StatisticsLoad {
  return statisticsLoadFor('30d')
}

/** Shared helpers for fixture consistency tests. */
export function completeFixtureConsistency(observation: StatisticsObservation): {
  readonly chartTasks: number
  readonly chartFailed: number
  readonly harnessTasks: number
  readonly harnessFailed: number
} {
  const population = sumDaily(observation.daily)
  let harnessTasks = 0
  let harnessFailed = 0
  for (const harness of observation.byHarness) {
    harnessTasks += harness.tasks
    if (harness.successRate.kind === 'reported') {
      harnessFailed += harness.successRate.failedCount
    }
  }
  return {
    chartTasks: population.tasks,
    chartFailed: population.failed,
    harnessTasks,
    harnessFailed,
  }
}

/** Documented rounding for complete populations. */
export function successPercentFromPopulation(
  tasks: number,
  failed: number,
): number {
  return tasks === 0 ? 0 : Math.round(((tasks - failed) / tasks) * 100)
}
