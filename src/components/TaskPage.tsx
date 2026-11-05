import type { TaskObservation } from '../model'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskTranscript } from './TaskTranscript'

type Props = {
  readonly observation: TaskObservation
  readonly onUnavailable: (label: string) => void
}

/** Ready-state running-task body — topbar title lives in TaskMain. */
export function TaskPage({ observation, onUnavailable }: Props) {
  return (
    <>
      <div
        className="hd-scroll"
        style={{ display: 'flex', flexDirection: 'column-reverse' }}
      >
        <TaskTranscript blocks={observation.blocks} />
      </div>
      <TaskFollowUp
        placeholder={observation.followUpPlaceholder}
        onUnavailable={onUnavailable}
      />
    </>
  )
}
