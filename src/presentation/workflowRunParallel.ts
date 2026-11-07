import type { WorkflowRunLoad, WorkflowRunObservation } from '../model'

export type WorkflowRunViewMode = 'graph' | 'parallel'

export type {
  WorkflowRunLane,
  WorkflowRunLaneBlock,
  WorkflowRunLaneStatus,
} from '../model'

/** True when this ready observation carries at least one Parallel lane. */
export function workflowRunHasParallel(run: WorkflowRunObservation): boolean {
  return run.parallel !== null && run.parallel.length > 0
}

/**
 * Parallel is shown only when the current observation includes lanes.
 * Missing data falls back to Graph without borrowing another run.
 */
export function effectiveWorkflowRunViewMode(
  mode: WorkflowRunViewMode,
  load: WorkflowRunLoad,
): WorkflowRunViewMode {
  if (mode !== 'parallel') return 'graph'
  if (load.kind !== 'ready' || !workflowRunHasParallel(load.run)) return 'graph'
  return 'parallel'
}
