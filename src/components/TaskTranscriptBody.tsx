import { useState, type RefObject } from 'react'
import type {
  ApprovalDecision,
  MessagingCapabilityLoad,
  TaskObservation,
  TranscriptObservation,
} from '../model'
import {
  type TaskApprovalChrome,
  type TaskCommandChrome,
  type TaskMessagingChrome,
  taskShowsSummary,
  taskStatusView,
} from '../presentation'
import { mergeTranscriptObservation } from '../presentation/transcriptMerge'
import { TaskConversationColumn } from './TaskConversationColumn'
import { TaskEventsPane } from './TaskEventsPane'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskFollowUp } from './TaskFollowUp'
import { TaskStatusNotice } from './TaskStatusNotice'
import { TaskSummarySection } from './TaskSummarySection'
import { TaskUnavailableHints } from './TaskUnavailableHints'
import { TranscriptSurface } from './TranscriptSurface'
import type { TaskShell } from './TaskPage'

type Props = {
  readonly observation: TaskObservation
  readonly commandChrome: TaskCommandChrome
  readonly messagingChrome: TaskMessagingChrome
  readonly approvalChrome: TaskApprovalChrome
  readonly messagingCapability: MessagingCapabilityLoad
  readonly eventsPaneOpen: boolean
  readonly shell: TaskShell
  readonly onClosePane?: () => void
  readonly liveRun: boolean
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
  readonly onCancelQueuedMessage?: (messageId: string) => void
  readonly onRespondApproval?: (decision: ApprovalDecision) => void
  readonly onRefreshApproval?: () => void
  readonly onStop?: () => void
  readonly onBannerStop?: () => void
  readonly composerStopRef?: RefObject<HTMLButtonElement | null>
  readonly bannerStopRef?: RefObject<HTMLButtonElement | null>
}

/** Ready task column + optional Events pane (extracted from TaskPage). */
export function TaskTranscriptBody({
  observation,
  commandChrome,
  messagingChrome,
  approvalChrome,
  messagingCapability,
  eventsPaneOpen,
  shell,
  onClosePane,
  liveRun,
  onUnavailable,
  onLiveMessage,
  onCancelQueuedMessage,
  onRespondApproval,
  onRefreshApproval,
  onStop,
  onBannerStop,
  composerStopRef,
  bannerStopRef,
}: Props) {
  const statusView = taskStatusView(
    observation,
    commandChrome,
    messagingCapability,
  )
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

  const column = (
    <>
      {statusView.body.kind === 'transcript' ? (
        <>
          <TranscriptSurface
            transcript={displayed}
            onReadingChange={onReadingChange}
            onAnnounce={publishAnnounce}
          />
          {statusView.notice ? (
            <div className="hw-task-notice-slot">
              <TaskStatusNotice
                notice={statusView.notice}
                onUnavailable={onUnavailable}
              />
            </div>
          ) : null}
          {statusView.banner ? (
            <TaskFailureBanner
              banner={statusView.banner}
              onUnavailable={onUnavailable}
              {...(onBannerStop ? { onStop: onBannerStop } : {})}
              {...(bannerStopRef ? { stopRef: bannerStopRef } : {})}
            />
          ) : null}
          {taskShowsSummary(observation) && observation.summary ? (
            <TaskSummarySection summary={observation.summary} />
          ) : null}
        </>
      ) : (
        <TaskConversationColumn
          observation={observation}
          view={statusView}
          messagingChrome={messagingChrome}
          approvalChrome={approvalChrome}
          onUnavailable={onUnavailable}
          onCancelQueuedMessage={onCancelQueuedMessage ?? (() => undefined)}
          {...(onRespondApproval ? { onRespondApproval } : {})}
          {...(onRefreshApproval ? { onRefreshApproval } : {})}
          {...(onBannerStop ? { onBannerStop } : {})}
          {...(bannerStopRef ? { bannerStopRef } : {})}
        />
      )}
      <TaskFollowUp
        composer={statusView.composer}
        onUnavailable={onUnavailable}
        {...(onStop ? { onStop } : {})}
        {...(composerStopRef ? { stopRef: composerStopRef } : {})}
      />
      <TaskUnavailableHints />
    </>
  )

  const eventsPane = eventsPaneOpen ? (
    <TaskEventsPane
      transcript={displayed}
      executionStatus={liveRun ? 'Running' : 'Done'}
      onUnavailable={onUnavailable}
      onClosePane={onClosePane ?? (() => undefined)}
      onCopyRecord={() => {
        void copyRecord(publishAnnounce)
      }}
    />
  ) : null

  return <>{shell(column, eventsPane)}</>
}

async function copyRecord(
  publishAnnounce: (message: string) => void,
): Promise<void> {
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
