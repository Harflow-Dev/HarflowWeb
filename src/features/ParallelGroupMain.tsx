import { ParallelGroupView } from '../components/ParallelGroupView'
import type { AppPresenter, ParallelGroupScreenState } from '../presentation'

type Props = {
  readonly state: ParallelGroupScreenState
  readonly presenter: AppPresenter
}

/** Parallel group main pane for the open group id only. */
export function ParallelGroupMain({ state, presenter }: Props) {
  return (
    <ParallelGroupView
      load={state.load}
      showPrompt={state.showPrompt}
      openMenuLaneId={state.openMenuLaneId}
      cancelAllConfirm={state.cancelAllConfirm}
      onShowPrompt={(show) => presenter.setParallelGroupShowPrompt(show)}
      onOpenMenuLaneId={(laneId) =>
        presenter.setParallelGroupOpenMenuLaneId(laneId)
      }
      onCancelAllConfirm={(open) =>
        presenter.setParallelGroupCancelAllConfirm(open)
      }
      onOpenTask={(taskId) => presenter.openTask(taskId)}
    />
  )
}
