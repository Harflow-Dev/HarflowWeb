import type { WorkflowRunParallel } from '../presentation'
import { WorkflowRunLane as Lane } from './WorkflowRunLane'

type Props = {
  readonly parallel: WorkflowRunParallel
}

/** Horizontal Parallel lanes and orchestrator footer for the open run. */
export function WorkflowRunParallelView({ parallel }: Props) {
  return (
    <>
      <div className="hd-lanes" role="region" aria-label="Parallel lanes">
        {parallel.lanes.map((lane) => (
          <Lane key={lane.id} lane={lane} />
        ))}
      </div>
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
        role="status"
      >
        <div className="hd-working">
          <span
            className="hd-glyph hd-glyph--running is-animated"
            aria-hidden="true"
          />
          <span>{parallel.workingLabel}</span>
        </div>
        <span style={{ flex: 1 }} />
        <span className="caption hd-faint">{parallel.decisionAttemptsLabel}</span>
      </div>
    </>
  )
}
