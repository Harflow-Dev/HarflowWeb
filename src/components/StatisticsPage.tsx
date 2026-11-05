import type {
  CostHeadline,
  StatisticsObservation,
  SuccessRateMetric,
} from '../model'
import { StatisticsChart } from './StatisticsChart'
import { StatisticsTable } from './StatisticsTable'

type Props = {
  readonly observation: StatisticsObservation
}

/** Ready-state body only — heading/range live in StatisticsMain. */
export function StatisticsPage({ observation }: Props) {
  return (
    <>
      {observation.coverage.kind === 'incomplete' ? (
        <p
          className="caption hd-faint"
          role="status"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          Incomplete coverage: {observation.coverage.reason}
        </p>
      ) : null}
      <div className="hd-grid hd-grid--4">
        <StatTile
          label="Tasks run"
          value={String(observation.tasksRun)}
          delta={observation.tasksRunCaption}
        />
        <StatTile
          label="Success rate"
          value={successValue(observation.successRate)}
          delta={successDelta(observation.successRate)}
        />
        <StatTile
          label="Agent time"
          value={
            observation.agentTime.kind === 'reported'
              ? observation.agentTime.display
              : '—'
          }
          delta={
            observation.agentTime.kind === 'reported'
              ? observation.agentTime.caption
              : 'Unknown for this range'
          }
        />
        <StatTile
          label="Reported cost"
          value={costValue(observation.reportedCost)}
          delta={costDelta(observation.reportedCost)}
        />
      </div>
      <StatisticsChart observation={observation} />
      <StatisticsTable observation={observation} />
    </>
  )
}

function StatTile({
  label,
  value,
  delta,
}: {
  readonly label: string
  readonly value: string
  readonly delta: string
}) {
  return (
    <div className="hd-stat">
      <span className="hd-stat__label">{label}</span>
      <span className="hd-stat__value">{value}</span>
      <span className="hd-stat__delta">{delta}</span>
    </div>
  )
}

function successValue(metric: SuccessRateMetric): string {
  if (metric.kind === 'suppressed') return '—'
  return `${metric.percent}%`
}

function successDelta(metric: SuccessRateMetric): string {
  if (metric.kind === 'suppressed') return metric.reason
  return metric.caption
}

function costValue(cost: CostHeadline): string {
  if (cost.kind === 'unavailable') return '—'
  return `$${cost.amountUsd.toFixed(2)}`
}

function costDelta(cost: CostHeadline): string {
  return cost.caption
}
