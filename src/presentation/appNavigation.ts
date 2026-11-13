import type { AppRoute } from './appState'
import type { ParallelGroupSession } from './parallelGroupSession'
import type { PendingLaunchesSession } from './pendingLaunchesSession'
import type { WorkflowExecutionSession } from './workflowExecutionSession'

/** Drop the run observation before any route that is not that run. */
export function closeWorkflowExecution(session: WorkflowExecutionSession): void {
  if (session.getState().runId === null) return
  session.close()
}

/** Drop the Parallel group observation before any other route. */
export function closeParallelGroup(session: ParallelGroupSession): void {
  if (session.getState().groupId === null) return
  session.close()
}

/** Drop pending-launch inventory/status when leaving that route. */
export function closePendingLaunches(session: PendingLaunchesSession): void {
  session.close()
}

/**
 * Close a run, group, or pending-launches view the next route does not keep.
 * False when the route is unchanged and nothing closes.
 */
export function navigationUpdatesRoute(
  current: AppRoute,
  route: AppRoute,
  execution: WorkflowExecutionSession,
  group: ParallelGroupSession,
  pending: PendingLaunchesSession,
): boolean {
  const runOpen = execution.getState().runId !== null
  const leavingRun = runOpen && route !== 'workflows'
  const dismissingRun = runOpen && route === 'workflows'
  if (leavingRun || dismissingRun) closeWorkflowExecution(execution)
  const groupOpen = group.getState().groupId !== null
  const leavingGroup = groupOpen && route !== 'parallel-group'
  if (leavingGroup) closeParallelGroup(group)
  const leavingPending = current === 'pending-launches' && route !== 'pending-launches'
  if (leavingPending) closePendingLaunches(pending)
  if (
    current === route &&
    !leavingRun &&
    !dismissingRun &&
    !leavingGroup &&
    !leavingPending
  ) {
    return false
  }
  return true
}
