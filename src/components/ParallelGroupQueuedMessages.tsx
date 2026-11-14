import type { QueuedLaneTailView } from '../presentation/parallelGroupQueuedMessages'
import {
  PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION,
  PARALLEL_GROUP_QUEUED_CANCEL_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

type Props = {
  readonly tail: QueuedLaneTailView
}

/**
 * Queued follow-ups below live activity; Cancel stays unavailable in the mock.
 * Rendered as direct children of the lane body so its flex gap spaces them.
 */
export function ParallelGroupQueuedMessages({ tail }: Props) {
  return (
    <>
      {tail.messages.map((message) => (
        <div
          key={message.id}
          className={
            message.pinned ? 'hd-msg-user hd-msgq hd-msgq--pending' : 'hd-msg-user hd-msgq'
          }
        >
          <span className="hd-msgq__caption">{message.caption}</span>
          <span className="hd-msgq__text">{message.text}</span>
          {message.note ? (
            <span className="hd-msgq__note">{message.note}</span>
          ) : null}
          {message.showCancel ? (
            <button
              type="button"
              className="hd-msgq__cancel"
              disabled
              aria-disabled="true"
              aria-label={message.cancelLabel}
              aria-describedby={PARALLEL_GROUP_QUEUED_CANCEL_UNAVAILABLE_ID}
              title={PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION}
            >
              Cancel
            </button>
          ) : null}
        </div>
      ))}
      {tail.outcome ? (
        <p className="hd-m05-caption hd-msgq__outcome">{tail.outcome}</p>
      ) : null}
    </>
  )
}
