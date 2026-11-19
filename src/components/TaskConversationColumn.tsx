import type { RefObject } from 'react'
import type { TaskObservation } from '../model'
import {
  TASK_OVERFLOW_COPY,
  taskQueuedTailView,
  type TaskMessagingCancelChrome,
  type TaskStatusView,
} from '../presentation'
import { ConversationItems } from './TaskConversationItems'
import { Icon } from './Icon'
import { QueuedMessageBubbles } from './QueuedMessageBubbles'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskRequestHead, TaskResourceCard } from './TaskRequestHead'
import { TaskStatusNotice } from './TaskStatusNotice'

type Props = {
  readonly observation: TaskObservation
  readonly view: TaskStatusView
  readonly messagingCancel: TaskMessagingCancelChrome
  readonly onUnavailable: (label: string) => void
  readonly onCancelQueuedMessage: (messageId: string) => void
  readonly onBannerStop?: () => void
  readonly bannerStopRef?: RefObject<HTMLButtonElement | null>
}

/**
 * M05 task column (HarflowDesign `columnHtml`): one scroller holding the
 * request head, resource card, notice, conversation and outcome banner, so
 * nothing sits outside it. No speaker labels, no history header, no live strip.
 */
export function TaskConversationColumn({
  observation,
  view,
  messagingCancel,
  onUnavailable,
  onCancelQueuedMessage,
  onBannerStop,
  bannerStopRef,
}: Props) {
  const { body } = view
  const items = observation.conversation?.items ?? []
  const hasWorking = items.some((item) => item.kind === 'working')
  const queueTail = taskQueuedTailView(observation, messagingCancel)
  const hasMessaging =
    queueTail.messages.length > 0 || queueTail.outcome !== null
  // With a live working row, bubbles interleave around it. With none (failed),
  // all bubbles append after the transcript body including the failure banner.
  const messagingInItems = hasMessaging && hasWorking
  const messagingAfterBanner = hasMessaging && !hasWorking

  return (
    <div className="hd-scroll hd-m05-scroll">
      <div className={`hd-transcript${hasMessaging ? ' hd-msgq-host' : ''}`}>
        {body.kind === 'notStarted' ? (
          <div className="hd-m05-request">
            <span className="hd-faint">{body.requestNote}</span>
          </div>
        ) : (
          <TaskRequestHead
            request={observation.conversation?.request ?? ''}
            onUnavailable={onUnavailable}
          />
        )}
        {observation.parent ? (
          <div className="hd-m05-prov-line">
            <Icon name="branch" size="sm" />
            {TASK_OVERFLOW_COPY.provenanceLine}
          </div>
        ) : null}
        {view.resourceCard ? (
          <TaskResourceCard card={view.resourceCard} onUnavailable={onUnavailable} />
        ) : null}
        {view.notice ? (
          <TaskStatusNotice notice={view.notice} onUnavailable={onUnavailable} />
        ) : null}
        {body.kind === 'notStarted' ? (
          <p className="hd-m05-empty">{body.emptyNote}</p>
        ) : (
          <ConversationItems
            items={items}
            {...(messagingInItems
              ? {
                  messaging: {
                    settled: queueTail.settled,
                    pinned: queueTail.pinned,
                    outcome: queueTail.outcome,
                    onCancel: onCancelQueuedMessage,
                    focusOutcomeSeq: messagingCancel.focusSeq,
                  },
                }
              : {})}
          />
        )}
        {view.banner ? (
          <TaskFailureBanner
            banner={view.banner}
            onUnavailable={onUnavailable}
            {...(onBannerStop ? { onStop: onBannerStop } : {})}
            {...(bannerStopRef ? { stopRef: bannerStopRef } : {})}
          />
        ) : null}
        {messagingAfterBanner ? (
          <QueuedMessageBubbles
            tail={queueTail}
            onCancel={onCancelQueuedMessage}
            focusOutcomeSeq={messagingCancel.focusSeq}
          />
        ) : null}
      </div>
    </div>
  )
}
