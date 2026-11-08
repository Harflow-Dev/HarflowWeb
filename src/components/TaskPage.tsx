import { useState, type ReactNode } from 'react'
import type { TaskObservation, TranscriptObservation } from '../model'
import { TaskEventsPane } from './TaskEventsPane'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskSummarySection } from './TaskSummarySection'
import { TaskTranscript } from './TaskTranscript'
import { TranscriptSurface } from './TranscriptSurface'

type Props = {
  readonly observation: TaskObservation
  readonly eventsPaneOpen?: boolean
  /** When set, wraps the transcript column so Events can sit as a split sibling. */
  readonly columnWrapper?: (column: ReactNode) => ReactNode
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
}

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({
  observation,
  eventsPaneOpen = false,
  columnWrapper,
  onUnavailable,
  onLiveMessage,
}: Props) {
  const running = observation.status === 'running'

  if (observation.transcript) {
    return (
      <TranscriptTaskBody
        key={observation.taskId}
        observation={observation}
        transcript={observation.transcript}
        eventsPaneOpen={eventsPaneOpen}
        running={running}
        onUnavailable={onUnavailable}
        {...(columnWrapper ? { columnWrapper } : {})}
        {...(onLiveMessage ? { onLiveMessage } : {})}
      />
    )
  }

  const legacy = (
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
  return columnWrapper ? columnWrapper(legacy) : legacy
}

function TranscriptTaskBody({
  observation,
  transcript,
  eventsPaneOpen,
  columnWrapper,
  running,
  onUnavailable,
  onLiveMessage,
}: {
  readonly observation: TaskObservation
  readonly transcript: TranscriptObservation
  readonly eventsPaneOpen: boolean
  readonly columnWrapper?: (column: ReactNode) => ReactNode
  readonly running: boolean
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
}) {
  const [local, setLocal] = useState(transcript)

  function announce(message: string): void {
    setLocal((prev) => ({ ...prev, liveMessage: message }))
    onLiveMessage?.(message)
  }

  async function copyRecord(): Promise<void> {
    const el = document.querySelector('[data-record]')
    if (!(el instanceof HTMLElement) || !el.textContent) {
      announce('Nothing to copy in this view.')
      return
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable')
      await navigator.clipboard.writeText(el.textContent)
      announce('Copied normalized mock record.')
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      el.focus()
      announce('Text selected. Use your system copy command to copy it.')
    }
  }

  const column = (
    <>
      <div className="hd-tr-host" style={{ display: 'contents' }}>
        <TranscriptSurface
          transcript={local}
          onTranscriptChange={setLocal}
          onAnnounce={announce}
        />
      </div>
      <TaskFollowUp
        placeholder={observation.followUpPlaceholder}
        showStop={running}
        onUnavailable={onUnavailable}
      />
    </>
  )

  const wrapped = columnWrapper ? columnWrapper(column) : column

  if (!eventsPaneOpen) {
    return <>{wrapped}</>
  }

  return (
    <>
      {wrapped}
      <TaskEventsPane
        transcript={local}
        executionStatus={running ? 'Running' : 'Done'}
        onUnavailable={onUnavailable}
        onCopyRecord={() => {
          void copyRecord()
        }}
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
