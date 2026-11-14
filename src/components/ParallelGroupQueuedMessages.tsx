import type { QueuedLaneTailView } from '../presentation/parallelGroupQueuedMessages'
import { QUEUED_MESSAGE_COPY } from '../presentation/parallelGroupQueuedMessages'

const CANCEL_UNAVAILABLE_ID = 'parallel-group-queued-cancel-unavailable'

type Props = {
  readonly tail: QueuedLaneTailView
}

/** Queued follow-ups below live activity; Cancel stays unavailable in the mock. */
export function ParallelGroupQueuedMessages({ tail }: Props) {
  if (tail.messages.length === 0 && tail.outcome === null) return null
  return (
    <div className="hd-msgq-host">
      <p id={CANCEL_UNAVAILABLE_ID} className="hd-sr">
        {QUEUED_MESSAGE_COPY.cancelUnavailable}
      </p>
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
              aria-describedby={CANCEL_UNAVAILABLE_ID}
              title={QUEUED_MESSAGE_COPY.cancelUnavailable}
            >
              Cancel
            </button>
          ) : null}
        </div>
      ))}
      {tail.outcome ? (
        <p className="hd-m05-caption hd-msgq__outcome">{tail.outcome}</p>
      ) : null}
    </div>
  )
}
