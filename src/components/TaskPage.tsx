import type { ReactNode, RefObject } from 'react'
import type {
  ApprovalDecision,
  MessagingCapabilityLoad,
  TaskObservation,
} from '../model'
import {
  EMPTY_TASK_APPROVAL,
  EMPTY_TASK_MESSAGING,
  type TaskApprovalChrome,
  type TaskCommandChrome,
  type TaskMessagingChrome,
  taskIsLiveRun,
  UNOBSERVED_MESSAGING,
} from '../presentation'
import { TaskTranscriptBody } from './TaskTranscriptBody'

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
  readonly messagingChrome?: TaskMessagingChrome
  readonly approvalChrome?: TaskApprovalChrome
  readonly messagingCapability?: MessagingCapabilityLoad
  readonly eventsPaneOpen?: boolean
  readonly shell?: TaskShell
  readonly onClosePane?: () => void
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

/** Ready-state task body — topbar title lives in TaskMain. */
export function TaskPage({
  observation,
  commandChrome = null,
  messagingChrome = EMPTY_TASK_MESSAGING,
  approvalChrome = EMPTY_TASK_APPROVAL,
  messagingCapability = UNOBSERVED_MESSAGING,
  eventsPaneOpen = false,
  shell = defaultShell,
  onClosePane,
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
  return (
    <TaskTranscriptBody
      key={observation.taskId}
      observation={observation}
      commandChrome={commandChrome}
      messagingChrome={messagingChrome}
      approvalChrome={approvalChrome}
      messagingCapability={messagingCapability}
      eventsPaneOpen={eventsPaneOpen}
      liveRun={taskIsLiveRun(observation)}
      onUnavailable={onUnavailable}
      {...(onCancelQueuedMessage ? { onCancelQueuedMessage } : {})}
      {...(onRespondApproval ? { onRespondApproval } : {})}
      {...(onRefreshApproval ? { onRefreshApproval } : {})}
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
