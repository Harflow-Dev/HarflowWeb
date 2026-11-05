import { STATISTICS_RANGES, type StatisticsRangeId } from '../model'

type Props = {
  readonly selectedRange: StatisticsRangeId
  readonly onSelectRange: (range: StatisticsRangeId) => void
}

/** Stable range selector — keep mounted across load transitions to preserve focus. */
export function StatisticsRangeBar({ selectedRange, onSelectRange }: Props) {
  return (
    <div className="hd-seg" role="group" aria-label="Period">
      {STATISTICS_RANGES.map((range) => {
        const active = range.id === selectedRange
        return (
          <button
            key={range.id}
            type="button"
            className={active ? 'hd-seg__item is-active' : 'hd-seg__item'}
            aria-pressed={active}
            onClick={() => onSelectRange(range.id)}
          >
            {range.label}
          </button>
        )
      })}
    </div>
  )
}
