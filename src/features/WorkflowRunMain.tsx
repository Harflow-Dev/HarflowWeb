import { WorkflowRunView } from '../components'
import type { WorkflowNodeId } from '../model'
import type { WorkflowExecutionScreenState } from '../presentation'

type Props = {
  readonly state: WorkflowExecutionScreenState
  readonly onSelectNode: (id: WorkflowNodeId | null) => void
}

/** Running workflow graph. The observation is for the open run id only. */
export function WorkflowRunMain({ state, onSelectNode }: Props) {
  return (
    <WorkflowRunView
      load={state.load}
      selectedNodeId={state.selectedNodeId}
      onSelectNode={onSelectNode}
    />
  )
}
