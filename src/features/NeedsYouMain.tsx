import { NeedsYouPage } from '../components'
import type { NeedsYouScreenState } from '../presentation'
import type { TaskId, WorkflowRunId } from '../model'

type Props = {
  readonly state: NeedsYouScreenState
  readonly onOpenTask: (taskId: TaskId) => void
  readonly onOpenRun: (runId: WorkflowRunId) => void
}

/** Needs you main pane. Approval and answer actions stay unavailable. */
export function NeedsYouMain({ state, onOpenTask, onOpenRun }: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        <NeedsYouPage load={state.load} onOpenTask={onOpenTask} onOpenRun={onOpenRun} />
      </div>
    </>
  )
}
