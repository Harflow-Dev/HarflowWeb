import { WorkflowRunView } from '../components'
import type { WorkflowNodeId } from '../model'
import type {
  WorkflowExecutionScreenState,
  WorkflowRunViewMode,
} from '../presentation'

type Props = {
  readonly state: WorkflowExecutionScreenState
  readonly onSelectNode: (id: WorkflowNodeId | null) => void
  readonly onViewMode: (mode: WorkflowRunViewMode) => void
}

/** Running workflow graph or Parallel lanes for the open run id only. */
export function WorkflowRunMain({ state, onSelectNode, onViewMode }: Props) {
  return (
    <WorkflowRunView
      load={state.load}
      selectedNodeId={state.selectedNodeId}
      viewMode={state.viewMode}
      onSelectNode={onSelectNode}
      onViewMode={onViewMode}
    />
  )
}
