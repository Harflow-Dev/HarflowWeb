import { NeedsYouPage } from '../components'
import type { NeedsYouScreenState } from '../presentation'
import type { TaskId } from '../model'

type Props = {
  readonly state: NeedsYouScreenState
  readonly onOpenTask: (taskId: TaskId) => void
}

/** Needs you main pane. Approval and answer actions stay unavailable. */
export function NeedsYouMain({ state, onOpenTask }: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        <NeedsYouPage load={state.load} onOpenTask={onOpenTask} />
      </div>
    </>
  )
}
