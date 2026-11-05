import { StatisticsPage, StatisticsRangeBar } from '../components'
import type { StatisticsRangeId } from '../model'
import type { StatisticsScreenState } from '../presentation'

type Props = {
  readonly state: StatisticsScreenState
  readonly onSelectRange: (range: StatisticsRangeId) => void
}

/**
 * Keeps the heading and range selector mounted across loading / ready /
 * unavailable so focus on a range button survives observation replacement.
 */
export function StatisticsMain({ state, onSelectRange }: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        <div
          className="hd-page"
          style={{ maxWidth: 1000, paddingTop: 'var(--space-2)' }}
        >
          <div className="hd-page__head">
            <h1 className="hd-page__title">Statistics</h1>
            <StatisticsRangeBar
              selectedRange={state.selectedRange}
              onSelectRange={onSelectRange}
            />
          </div>
          <StatisticsBody state={state} />
        </div>
      </div>
    </>
  )
}

function StatisticsBody({ state }: { readonly state: StatisticsScreenState }) {
  if (state.load.kind === 'ready') {
    return <StatisticsPage observation={state.load.observation} />
  }
  return (
    <p className="caption hd-faint" role="status">
      {state.load.kind === 'loading'
        ? 'Loading statistics… (proposal — not a design-approved specimen)'
        : state.load.message}
    </p>
  )
}
