import type {
  WorkflowNodeId,
  WorkflowRunObservation,
  WorkflowRunOnDemand,
} from '../model'

/**
 * Inspector for one standalone node on this run.
 * A missing node, a path node, or another node's id returns null.
 */
export function workflowRunOnDemandFor(
  run: WorkflowRunObservation,
  nodeId: WorkflowNodeId,
): WorkflowRunOnDemand | null {
  const node = run.nodes.find((item) => item.id === nodeId)
  if (!node || node.placement !== 'standalone') return null
  const detail = run.onDemand.find((item) => item.nodeId === nodeId)
  if (!detail || detail.nodeId !== node.id) return null
  return detail
}

/**
 * Presentation selection. A request that is not this run's own inspector
 * falls back to the observation's selected node and its default detail.
 */
export function resolveWorkflowRunSelection(
  run: WorkflowRunObservation,
  requestedId: WorkflowNodeId | null,
): {
  readonly nodeId: WorkflowNodeId
  readonly onDemand: WorkflowRunOnDemand | null
} {
  if (requestedId) {
    const onDemand = workflowRunOnDemandFor(run, requestedId)
    if (onDemand) return { nodeId: requestedId, onDemand }
  }
  return { nodeId: run.selectedNodeId, onDemand: null }
}
