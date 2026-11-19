import { useState, type ReactNode, type RefObject } from 'react'
import type {
  MessagingCapabilityLoad,
  TaskObservation,
  TranscriptObservation,
} from '../model'
import {
  EMPTY_MESSAGING_CANCEL,
  type TaskCommandChrome,
  type TaskMessagingCancelChrome,
  taskIsLiveRun,
  taskShowsSummary,
  taskStatusView,
  UNOBSERVED_MESSAGING,
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

/** Places the column and an optional Events pane inside the host's body. */
export type TaskShell = (
  column: ReactNode,
  eventsPane: ReactNode,
) => ReactNode

const defaultShell: TaskShell = (column, pane) => (
  <>
    {column}
    {pane}
  </>
)

type Props = {
  readonly observation: TaskObservation
  readonly commandChrome?: TaskCommandChrome
  readonly messagingCancel?: TaskMessagingCancelChrome
  readonly messagingCapability?: MessagingCapabilityLoad
  readonly eventsPaneOpen?: boolean
  /**
   * Lays out the transcript column and the Events pane as siblings (the
   * host owns the body, inert region and Changes pane). Default: sequence.
   */
  readonly shell?: TaskShell
  readonly onClosePane?: () => void
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
  readonly onCancelQueuedMessage?: (messageId: string) => void
  readonly onStop?: () => void
  readonly onBannerStop?: () => void
  readonly composerStopRef?: RefObject<HTMLButtonElement | null>
  readonly bannerStopRef?: RefObject<HTMLButtonElement | null>
}

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({
  observation,
  commandChrome = null,
  messagingCancel = EMPTY_MESSAGING_CANCEL,
  messagingCapability = UNOBSERVED_MESSAGING,
  eventsPaneOpen = false,
  shell = defaultShell,
  onClosePane,
  onUnavailable,
  onLiveMessage,
  onCancelQueuedMessage,
  onStop,
  onBannerStop,
  composerStopRef,
  bannerStopRef,
}: Props) {
  const liveRun = taskIsLiveRun(observation)
  return (
    <TranscriptTaskBody
      key={observation.taskId}
      observation={observation}
      commandChrome={commandChrome}
      messagingCancel={messagingCancel}
      messagingCapability={messagingCapability}
      eventsPaneOpen={eventsPaneOpen}
      liveRun={liveRun}
      onUnavailable={onUnavailable}
      {...(onCancelQueuedMessage ? { onCancelQueuedMessage } : {})}
      {...(onStop ? { onStop } : {})}
      {...(onBannerStop ? { onBannerStop } : {})}
      {...(composerStopRef ? { composerStopRef } : {})}
      {...(bannerStopRef ? { bannerStopRef } : {})}
      shell={shell}
      {...(onClosePane ? { onClosePane } : {})}
      {...(onLiveMessage ? { onLiveMessage } : {})}
    />
  )
}

function TranscriptTaskBody({
  observation,
  commandChrome,
  messagingCancel,
  messagingCapability,
  eventsPaneOpen,
  shell,
  onClosePane,
  liveRun,
  onUnavailable,
  onLiveMessage,
  onCancelQueuedMessage,
  onStop,
  onBannerStop,
  composerStopRef,
  bannerStopRef,
}: {
  readonly observation: TaskObservation
  readonly commandChrome: TaskCommandChrome
  readonly messagingCancel: TaskMessagingCancelChrome
  readonly messagingCapability: MessagingCapabilityLoad
  readonly eventsPaneOpen: boolean
  readonly shell: TaskShell
  readonly onClosePane?: () => void
  readonly liveRun: boolean
  readonly onUnavailable: (label: string) => void
  readonly onLiveMessage?: (message: string) => void
  readonly onCancelQueuedMessage?: (messageId: string) => void
  readonly onStop?: () => void
  readonly onBannerStop?: () => void
  readonly composerStopRef?: RefObject<HTMLButtonElement | null>
  readonly bannerStopRef?: RefObject<HTMLButtonElement | null>
}) {
  const statusView = taskStatusView(observation, commandChrome, messagingCapability)
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
          messagingCancel={messagingCancel}
          onUnavailable={onUnavailable}
          onCancelQueuedMessage={onCancelQueuedMessage ?? (() => undefined)}
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
        void copyRecord()
      }}
    />
  ) : null

  return <>{shell(column, eventsPane)}</>
}
