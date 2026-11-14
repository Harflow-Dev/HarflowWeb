import type { TaskObservation } from '../model'
import type { TaskStatusView } from '../presentation'
import { ConversationItems } from './TaskConversationItems'
import { TaskFailureBanner } from './TaskFailureBanner'
import { TaskRequestHead, TaskResourceCard } from './TaskRequestHead'
import { TaskStatusNotice } from './TaskStatusNotice'

type Props = {
  readonly observation: TaskObservation
  readonly view: TaskStatusView
  readonly onUnavailable: (label: string) => void
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
          <TaskFailureBanner banner={view.banner} onUnavailable={onUnavailable} />
        ) : null}
      </div>
    </div>
  )
}
