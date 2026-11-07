import type { WorkflowRunViewMode } from '../presentation'
import {
  RUN_PARALLEL_UNAVAILABLE_ID,
} from './workflowRunUnavailable'

type Props = {
  readonly activeView: WorkflowRunViewMode
  readonly parallelAvailable: boolean
  readonly onViewMode: (mode: WorkflowRunViewMode) => void
}

/** Graph / Parallel segment for the run topbar. */
export function WorkflowRunViewToggle({
  activeView,
  parallelAvailable,
  onViewMode,
}: Props) {
  return (
    <div className="hd-seg" role="group" aria-label="Run view">
      <button
        type="button"
        className={`hd-seg__item${activeView === 'graph' ? ' is-active' : ''}`}
        aria-current={activeView === 'graph' ? 'page' : undefined}
        aria-pressed={activeView === 'graph'}
        onClick={() => onViewMode('graph')}
      >
        Graph
      </button>
      <button
        type="button"
        className={`hd-seg__item${activeView === 'parallel' ? ' is-active' : ''}`}
        aria-current={activeView === 'parallel' ? 'page' : undefined}
        aria-pressed={parallelAvailable ? activeView === 'parallel' : undefined}
        disabled={!parallelAvailable}
        aria-disabled={parallelAvailable ? undefined : 'true'}
        aria-describedby={
          parallelAvailable ? undefined : RUN_PARALLEL_UNAVAILABLE_ID
        }
        onClick={() => {
          if (parallelAvailable) onViewMode('parallel')
        }}
      >
        Parallel
      </button>
    </div>
  )
}
