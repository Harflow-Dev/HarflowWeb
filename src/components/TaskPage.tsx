import type { TaskObservation } from '../model'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskSummarySection } from './TaskSummarySection'
import { TaskTranscript } from './TaskTranscript'

type Props = {
  readonly observation: TaskObservation
  readonly onUnavailable: (label: string) => void
}

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({ observation, onUnavailable }: Props) {
  const running = observation.status === 'running'
  return (
    <>
      <div
        className="hd-scroll"
        style={{ display: 'flex', flexDirection: 'column-reverse' }}
      >
        <TaskTranscript
          blocks={observation.blocks}
          footer={transcriptFooter(observation, onUnavailable)}
        />
      </div>
      <TaskFollowUp
        placeholder={observation.followUpPlaceholder}
        showStop={running}
        onUnavailable={onUnavailable}
      />
    </>
  )
}

function transcriptFooter(
  observation: TaskObservation,
  onUnavailable: (label: string) => void,
) {
  if (observation.status === 'failed') {
    return (
      <TaskFailureBanner
        failure={observation.failure}
        onUnavailable={onUnavailable}
      />
    )
  }
  if (observation.status === 'completed') {
    return <TaskSummarySection summary={observation.summary} />
  }
  return null
}
