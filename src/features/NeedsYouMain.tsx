import type { ApprovalDecision, TaskId, WorkflowRunId } from '../model'
import type { NeedsYouScreenState } from '../presentation'
import { NeedsYouPage } from '../components'

type Props = {
  readonly state: NeedsYouScreenState
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
  readonly onRespondTask: (itemId: string, decision: ApprovalDecision) => void
  readonly onRefreshTask: (itemId: string) => void
  readonly onRespondCheckpoint: (
    itemId: string,
    decision: ApprovalDecision,
  ) => void
  readonly onRefreshCheckpoint: (itemId: string) => void
}

/** Needs you main pane with live task approvals and workflow checkpoints. */
export function NeedsYouMain({
  state,
  onOpenTask,
  onOpenRun,
  onRespondTask,
  onRefreshTask,
  onRespondCheckpoint,
  onRefreshCheckpoint,
}: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        <NeedsYouPage
          state={state}
          onOpenTask={onOpenTask}
          onOpenRun={onOpenRun}
          onRespondTask={onRespondTask}
          onRefreshTask={onRefreshTask}
          onRespondCheckpoint={onRespondCheckpoint}
          onRefreshCheckpoint={onRefreshCheckpoint}
        />
      </div>
    </>
  )
}
