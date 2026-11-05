import type { TaskObservation } from '../model'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskTranscript } from './TaskTranscript'

type Props = {
  readonly observation: TaskObservation
  readonly onUnavailable: (label: string) => void
}

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({ observation, onUnavailable }: Props) {
  const failed = observation.status === 'failed'
  return (
    <>
      <div
        className="hd-scroll"
        style={{ display: 'flex', flexDirection: 'column-reverse' }}
      >
        <TaskTranscript
          blocks={observation.blocks}
          footer={
            failed ? (
              <TaskFailureBanner
                failure={observation.failure}
                onUnavailable={onUnavailable}
              />
            ) : null
          }
        />
      </div>
      <TaskFollowUp
        placeholder={observation.followUpPlaceholder}
        showStop={!failed}
        onUnavailable={onUnavailable}
      />
    </>
  )
}
