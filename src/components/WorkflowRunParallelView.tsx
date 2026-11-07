import type { WorkflowRunLane } from '../presentation'
import { WorkflowRunLane as Lane } from './WorkflowRunLane'

type Props = {
  readonly lanes: readonly WorkflowRunLane[]
}

/** Horizontal Parallel lanes for the open run. */
export function WorkflowRunParallelView({ lanes }: Props) {
  return (
    <div className="hd-lanes" role="region" aria-label="Parallel lanes">
      {lanes.map((lane) => (
        <Lane key={lane.id} lane={lane} />
      ))}
    </div>
  )
}
