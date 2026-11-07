import type { WorkflowRunLoad } from '../model'
import {
  effectiveWorkflowRunViewMode,
  workflowRunHasParallel,
  type WorkflowRunViewMode,
} from '../presentation'
import { RUN_UNAVAILABLE_ID } from './workflowRunUnavailable'

type Props = {
  readonly load: WorkflowRunLoad
  readonly viewMode: WorkflowRunViewMode
  readonly onViewMode: (mode: WorkflowRunViewMode) => void
}

/** Graph / Parallel segment for the run topbar. */
export function WorkflowRunViewToggle({ load, viewMode, onViewMode }: Props) {
  const active = effectiveWorkflowRunViewMode(viewMode, load)
  const parallelOk = load.kind === 'ready' && workflowRunHasParallel(load.run)
  return (
    <div className="hd-seg" role="group" aria-label="Run view">
      <button
        type="button"
        className={`hd-seg__item${active === 'graph' ? ' is-active' : ''}`}
        aria-current={active === 'graph' ? 'page' : undefined}
        aria-pressed={active === 'graph'}
        onClick={() => onViewMode('graph')}
      >
        Graph
      </button>
      <button
        type="button"
        className={`hd-seg__item${active === 'parallel' ? ' is-active' : ''}`}
        aria-current={active === 'parallel' ? 'page' : undefined}
        aria-pressed={parallelOk ? active === 'parallel' : undefined}
        disabled={!parallelOk}
        aria-disabled={parallelOk ? undefined : 'true'}
        aria-describedby={parallelOk ? undefined : RUN_UNAVAILABLE_ID}
        onClick={() => {
          if (parallelOk) onViewMode('parallel')
        }}
      >
        Parallel
      </button>
    </div>
  )
}
