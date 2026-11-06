import { WorkflowRunView } from '../components'
import type { WorkflowExecutionScreenState } from '../presentation'

type Props = {
  readonly state: WorkflowExecutionScreenState
}

/** Running workflow graph. The observation is for the open run id only. */
export function WorkflowRunMain({ state }: Props) {
  return <WorkflowRunView load={state.load} />
}
