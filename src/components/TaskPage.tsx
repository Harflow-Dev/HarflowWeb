import { useState, type ReactNode } from 'react'
import type { TaskObservation, TranscriptObservation } from '../model'
import { TaskEventsPane } from './TaskEventsPane'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskSummarySection } from './TaskSummarySection'
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
  return (
    <TranscriptTaskBody
      key={observation.taskId}
      observation={observation}
      eventsPaneOpen={eventsPaneOpen}
      running={running}
      onUnavailable={onUnavailable}
      {...(columnWrapper ? { columnWrapper } : {})}
      {...(onLiveMessage ? { onLiveMessage } : {})}
    />
  )
}

function TranscriptTaskBody({
  observation,
  eventsPaneOpen,
  columnWrapper,
  running,
  onUnavailable,
  onLiveMessage,
}: {
  readonly observation: TaskObservation
  readonly eventsPaneOpen: boolean
  readonly columnWrapper?: (column: ReactNode) => ReactNode
  readonly running: boolean
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
}) {
  const observed = observation.transcript
  const [prevObserved, setPrevObserved] = useState(observed)
  // Local reading overlay only — cleared whenever the observation updates.
  const [reading, setReading] = useState<TranscriptObservation | null>(null)
  const [announce, setAnnounce] = useState('')

  if (observed !== prevObserved) {
    setPrevObserved(observed)
    setReading(null)
    setAnnounce('')
  }

  const base = reading ?? observed
  const displayed: TranscriptObservation = announce
    ? { ...base, liveMessage: announce }
    : base

  function onReadingChange(next: TranscriptObservation): void {
    setReading(next)
    setAnnounce(next.liveMessage)
    if (next.liveMessage) onLiveMessage?.(next.liveMessage)
  }

  function publishAnnounce(message: string): void {
    setAnnounce(message)
    onLiveMessage?.(message)
  }

  async function copyRecord(): Promise<void> {
    const el = document.querySelector('[data-record]')
    if (!(el instanceof HTMLElement) || !el.textContent) {
      publishAnnounce('Nothing to copy in this view.')
      return
    }
    const text = el.textContent
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable')
      await navigator.clipboard.writeText(text)
      publishAnnounce('Copied normalized mock record.')
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      el.focus()
      publishAnnounce('Text selected. Use your system copy command to copy it.')
    }
  }

  const column = (
    <>
      <TranscriptSurface
        transcript={displayed}
        onReadingChange={onReadingChange}
        onAnnounce={publishAnnounce}
      />
      {observation.status === 'failed' ? (
        <TaskFailureBanner
          failure={observation.failure}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {observation.status === 'completed' ? (
        <TaskSummarySection summary={observation.summary} />
      ) : null}
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
        transcript={displayed}
        executionStatus={running ? 'Running' : 'Done'}
        onUnavailable={onUnavailable}
        onCopyRecord={() => {
          void copyRecord()
        }}
      />
    </>
  )
}
