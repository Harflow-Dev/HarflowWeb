import type { ReactNode } from 'react'
import type {
  HarnessStatisticsRow,
  ReportedCost,
  StatisticsObservation,
} from '../model'

export function StatisticsTable({
  observation,
}: {
  readonly observation: StatisticsObservation
}) {
  return (
    <div className="hd-card" style={{ marginTop: 'var(--space-4)' }}>
      <h2 className="hd-card__title">By harness</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            <Th align="left">Harness</Th>
            <Th align="right">Tasks</Th>
            <Th align="right">Success</Th>
            <Th align="right">Median duration</Th>
            <Th align="right">Cost</Th>
          </tr>
        </thead>
        <tbody>
          {observation.byHarness.map((row) => (
            <HarnessRow key={row.harnessId} row={row} />
          ))}
        </tbody>
      </table>
      <p className="caption hd-faint" style={{ marginTop: 'var(--space-3)' }}>
        {observation.provenance} Labels are fixture presentation facts, not
        installed/qualified backend claims. Units: tasks=
        {observation.units.tasks}, cost={observation.units.cost}.
      </p>
    </div>
  )
}

function HarnessRow({ row }: { readonly row: HarnessStatisticsRow }) {
  return (
    <tr>
      <Td align="left">{row.label}</Td>
      <Td align="right" numeric>
        {row.tasks}
      </Td>
      <Td align="right" numeric>
        {successText(row)}
      </Td>
      <Td align="right" numeric>
        {medianText(row)}
      </Td>
      <Td align="right" numeric>
        {costText(row.cost)}
      </Td>
    </tr>
  )
}

function successText(row: HarnessStatisticsRow): string {
  if (row.successRate.kind === 'suppressed') return '—'
  return `${row.successRate.percent}%`
}

function medianText(row: HarnessStatisticsRow): string {
  if (row.medianDuration.kind === 'suppressed') return '—'
  return row.medianDuration.display
}

function costText(cost: ReportedCost): ReactNode {
  if (cost.kind === 'unavailable') {
    return <span className="hd-faint">Unavailable</span>
  }
  return formatUsd(cost.amountUsd)
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function Th({
  children,
  align,
}: {
  children: ReactNode
  align: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      style={{
        textAlign: align,
        padding: '8px 12px',
        fontWeight: 500,
        fontSize: 12,
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align,
  numeric,
}: {
  children: ReactNode
  align: 'left' | 'right'
  numeric?: boolean
}) {
  return (
    <td
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        textAlign: align,
        fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
      }}
    >
      {children}
    </td>
  )
}
