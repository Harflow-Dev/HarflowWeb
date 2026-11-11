import type { WorkflowRunLoad, WorkflowRunObservation } from '../model'

export type WorkflowRunViewMode = 'graph' | 'parallel'

export type {
  WorkflowRunLane,
  WorkflowRunLaneBlock,
  WorkflowRunLaneStatus,
  WorkflowRunParallel,
} from '../model'

/** True when this ready observation carries at least one Parallel lane. */
export function workflowRunHasParallel(run: WorkflowRunObservation): boolean {
  return run.parallel !== null && run.parallel.lanes.length > 0
}

/**
 * Parallel is shown only when the current observation includes lanes.
 * Missing data falls back to Graph without borrowing another run.
 * While the first load is in flight, a Parallel preference is kept so the
 * loading-parallel skeleton can match Design `workflow-run/loading-parallel`.
 */
export function effectiveWorkflowRunViewMode(
  mode: WorkflowRunViewMode,
  load: WorkflowRunLoad,
): WorkflowRunViewMode {
  if (mode !== 'parallel') return 'graph'
  if (load.kind === 'loading') return 'parallel'
  if (load.kind !== 'ready' || !workflowRunHasParallel(load.run)) return 'graph'
  return 'parallel'
}
