import { WorkflowRunView } from '../components'
import type { WorkflowNodeId } from '../model'
import {
  effectiveWorkflowRunViewMode,
  workflowRunHasParallel,
  type WorkflowExecutionScreenState,
  type WorkflowRunViewMode,
} from '../presentation'

type Props = {
  readonly state: WorkflowExecutionScreenState
  readonly onSelectNode: (id: WorkflowNodeId | null) => void
  readonly onViewMode: (mode: WorkflowRunViewMode) => void
}

/** Running workflow graph or Parallel lanes for the open run id only. */
export function WorkflowRunMain({ state, onSelectNode, onViewMode }: Props) {
  const load = state.load
  const activeView = effectiveWorkflowRunViewMode(state.viewMode, load)
  const parallelAvailable =
    load.kind === 'ready' && workflowRunHasParallel(load.run)
  return (
    <WorkflowRunView
      load={load}
      selectedNodeId={state.selectedNodeId}
      activeView={activeView}
      parallelAvailable={parallelAvailable}
      onSelectNode={onSelectNode}
      onViewMode={onViewMode}
    />
  )
}
