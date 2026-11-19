import { useEffect, useRef } from 'react'
import type { QueuedMessagesTailView } from '../presentation/queuedMessages'
import {
  PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION,
  PARALLEL_GROUP_QUEUED_CANCEL_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

type Props = {
  readonly tail: QueuedMessagesTailView
  /**
   * When set, Cancel is interactive and calls with the message id.
   * When omitted, Cancel stays unavailable (Parallel lane mock).
   */
  readonly onCancel?: (messageId: string) => void
  /** Bumped when Cancel should move focus to the outcome line. */
  readonly focusOutcomeSeq?: number
}

/**
 * Queued follow-up bubbles and outcome line shared by Parallel lanes and the
 * task screen. Cancel is unavailable unless `onCancel` is provided.
 */
export function QueuedMessageBubbles({
  tail,
  onCancel,
  focusOutcomeSeq = 0,
}: Props) {
  const outcomeRef = useRef<HTMLParagraphElement>(null)
  const cancelInteractive = onCancel !== undefined

  useEffect(() => {
    if (focusOutcomeSeq <= 0) return
    outcomeRef.current?.focus()
  }, [focusOutcomeSeq])

  return (
    <>
      {tail.messages.map((message) => (
        <div
          key={message.id}
          className={
            message.pinned
              ? 'hd-msg-user hd-msgq hd-msgq--pending'
              : 'hd-msg-user hd-msgq'
          }
          data-message={message.id}
        >
          <span className="hd-msgq__caption">{message.caption}</span>
          <span className="hd-msgq__text">{message.text}</span>
          {message.note ? (
            <span className="hd-msgq__note">{message.note}</span>
          ) : null}
          {message.showCancel ? (
            cancelInteractive ? (
              <button
                type="button"
                className="hd-msgq__cancel"
                aria-label={message.cancelLabel}
                onClick={(event) => {
                  event.preventDefault()
                  onCancel(message.id)
                }}
              >
                Cancel
              </button>
            ) : (
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
            )
          ) : null}
        </div>
      ))}
      {tail.outcome ? (
        <p
          ref={outcomeRef}
          className="hd-m05-caption hd-msgq__outcome"
          tabIndex={-1}
        >
          {tail.outcome}
        </p>
      ) : null}
    </>
  )
}
