import type { ParallelGroupLoad, WorkflowRunLane } from '../model'
import { PARALLEL_GROUP_UNAVAILABLE } from '../model'
import { WorkflowRunLane as Lane } from './WorkflowRunLane'
import {
  PARALLEL_GROUP_ACTION_EXPLANATION,
  PARALLEL_GROUP_ACTION_UNAVAILABLE_ID,
  PARALLEL_GROUP_LANE_EXPLANATION,
  PARALLEL_GROUP_LANE_UNAVAILABLE_ID,
  PARALLEL_GROUP_TOOL_EXPLANATION,
  PARALLEL_GROUP_TOOL_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

type Props = {
  readonly load: ParallelGroupLoad
}

/**
 * Read-only Parallel group screen.
 * View prompt, Cancel all, lane actions, tools, and composers stay disabled.
 */
export function ParallelGroupView({ load }: Props) {
  if (load.kind === 'loading') {
    return <p role="status">Loading parallel group…</p>
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const group = load.group
  if (group.lanes.length === 0) {
    return <p role="status">{PARALLEL_GROUP_UNAVAILABLE}</p>
  }
  return (
    <>
      <p id={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_ACTION_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_LANE_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_LANE_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_TOOL_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_TOOL_EXPLANATION}
      </p>
      <div className="hd-topbar">
        <span className="hd-topbar__title">{group.title}</span>
        <span className="hd-badge hd-badge--running">
          <span className="hd-badge__spin" aria-hidden="true" />
          {group.statusLabel}
        </span>
        <span className="hd-topbar__meta">{group.enforcementLabel}</span>
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className="hd-btn hd-btn--ghost"
          disabled
          aria-disabled="true"
          aria-describedby={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID}
          title={PARALLEL_GROUP_ACTION_EXPLANATION}
        >
          View prompt
        </button>
        <button
          type="button"
          className="hd-btn hd-btn--danger"
          disabled
          aria-disabled="true"
          aria-describedby={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID}
          title={PARALLEL_GROUP_ACTION_EXPLANATION}
        >
          Cancel all
        </button>
      </div>
      <div className="hd-lanes" role="region" aria-label="Parallel group lanes">
        {group.lanes.map((lane: WorkflowRunLane) => (
          <Lane
            key={lane.id}
            lane={lane}
            laneUnavailableId={PARALLEL_GROUP_LANE_UNAVAILABLE_ID}
            laneExplanation={PARALLEL_GROUP_LANE_EXPLANATION}
            toolUnavailableId={PARALLEL_GROUP_TOOL_UNAVAILABLE_ID}
            toolExplanation={PARALLEL_GROUP_TOOL_EXPLANATION}
          />
        ))}
      </div>
    </>
  )
}
