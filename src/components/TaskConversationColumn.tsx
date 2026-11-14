import type { RefObject } from 'react'
import type { TaskObservation } from '../model'
import {
  TASK_OVERFLOW_COPY,
  type TaskStatusView,
} from '../presentation'
import { ConversationItems } from './TaskConversationItems'
import { Icon } from './Icon'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskRequestHead, TaskResourceCard } from './TaskRequestHead'
import { TaskStatusNotice } from './TaskStatusNotice'

type Props = {
  readonly observation: TaskObservation
  readonly view: TaskStatusView
  readonly onUnavailable: (label: string) => void
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
  onUnavailable,
  onBannerStop,
  bannerStopRef,
}: Props) {
  const { body } = view
  return (
    <div className="hd-scroll hd-m05-scroll">
      <div className="hd-transcript">
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
          <ConversationItems items={observation.conversation?.items ?? []} />
        )}
        {view.banner ? (
          <TaskFailureBanner
            banner={view.banner}
            onUnavailable={onUnavailable}
            {...(onBannerStop ? { onStop: onBannerStop } : {})}
            {...(bannerStopRef ? { stopRef: bannerStopRef } : {})}
          />
        ) : null}
      </div>
    </div>
  )
}
