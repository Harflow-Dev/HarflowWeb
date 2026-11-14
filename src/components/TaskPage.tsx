import { useState, type ReactNode } from 'react'
import type { TaskObservation, TranscriptObservation } from '../model'
import {
  type TaskCommandChrome,
  taskIsLiveRun,
  taskShowsSummary,
  taskStatusView,
} from '../presentation'
import { TASK_PENDING_BODY } from '../presentation/taskStatusCopy'
import { mergeTranscriptObservation } from '../presentation/transcriptMerge'
import { TaskEventsPane } from './TaskEventsPane'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskStatusNotice } from './TaskStatusNotice'
import { TaskSummarySection } from './TaskSummarySection'
import { TaskUnavailableHints } from './TaskUnavailableHints'
import { TranscriptSurface } from './TranscriptSurface'

type Props = {
  readonly observation: TaskObservation
  readonly commandChrome?: TaskCommandChrome
  readonly eventsPaneOpen?: boolean
  /** When set, wraps the transcript column so Events can sit as a split sibling. */
  readonly columnWrapper?: (column: ReactNode) => ReactNode
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
}

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({
  observation,
  commandChrome = null,
  eventsPaneOpen = false,
  columnWrapper,
  onUnavailable,
  onLiveMessage,
}: Props) {
  const liveRun = taskIsLiveRun(observation)
  return (
    <TranscriptTaskBody
      key={observation.taskId}
      observation={observation}
      commandChrome={commandChrome}
      eventsPaneOpen={eventsPaneOpen}
      liveRun={liveRun}
      onUnavailable={onUnavailable}
      {...(columnWrapper ? { columnWrapper } : {})}
      {...(onLiveMessage ? { onLiveMessage } : {})}
    />
  )
}

function TranscriptTaskBody({
  observation,
  commandChrome,
  eventsPaneOpen,
  columnWrapper,
  liveRun,
  onUnavailable,
  onLiveMessage,
}: {
  readonly observation: TaskObservation
  readonly commandChrome: TaskCommandChrome
  readonly eventsPaneOpen: boolean
  readonly columnWrapper?: (column: ReactNode) => ReactNode
  readonly liveRun: boolean
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
}) {
  const statusView = taskStatusView(observation, commandChrome)
  const observed = observation.transcript
  const [prevObserved, setPrevObserved] = useState(observed)
  const [reading, setReading] = useState<TranscriptObservation | null>(null)
  const [announce, setAnnounce] = useState('')

  if (observed !== prevObserved) {
    setPrevObserved(observed)
    setReading(mergeTranscriptObservation(observed, reading))
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

  const pending =
    observation.statusRead.kind === 'observed' &&
    observation.statusRead.status === 'pending'

  const column = (
    <>
      {pending ? (
        <div className="hd-scroll" style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <div className="hd-m05-request">
            <span className="hd-faint">{TASK_PENDING_BODY.requestDeferred}</span>
          </div>
          <p className="hd-m05-empty">{TASK_PENDING_BODY.emptyActivity}</p>
        </div>
      ) : (
        <TranscriptSurface
          transcript={displayed}
          onReadingChange={onReadingChange}
          onAnnounce={publishAnnounce}
        />
      )}
      {statusView.notice ? (
        <TaskStatusNotice
          notice={statusView.notice}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {statusView.banner ? (
        <TaskFailureBanner
          banner={statusView.banner}
          onUnavailable={onUnavailable}
        />
      ) : null}
      {taskShowsSummary(observation) && observation.summary ? (
        <TaskSummarySection summary={observation.summary} />
      ) : null}
      <TaskFollowUp
        composer={statusView.composer}
        onUnavailable={onUnavailable}
      />
      <TaskUnavailableHints />
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
        executionStatus={liveRun ? 'Running' : 'Done'}
        onUnavailable={onUnavailable}
        onCopyRecord={() => {
          void copyRecord()
        }}
      />
    </>
  )
}