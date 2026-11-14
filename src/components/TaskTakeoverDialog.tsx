import {
  TASK_OVERFLOW_COPY,
  TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION,
  TASK_TAKEOVER_CONFIRM_UNAVAILABLE_ID,
} from '../presentation'
import { useModalFocusTrap } from './useModalFocusTrap'

type Props = {
  readonly accessLabel: string
  readonly onClose: () => void
}

/**
 * Takeover confirmation. App-level scrim; caller makes sidebar and main inert.
 * Focus starts on Cancel; confirm stays unavailable in this mock.
 */
export function TaskTakeoverDialog({ accessLabel, onClose }: Props) {
  const { dialogRef, dismissRef } = useModalFocusTrap(onClose)
  const titleId = 'task-takeover-title'
  const bodyId = 'task-takeover-body'

  return (
    <div className="hd-scrim hd-m05-scrim">
      <div
        ref={dialogRef}
        className="hd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <h2 className="hd-dialog__title" id={titleId}>
          {TASK_OVERFLOW_COPY.takeoverDialogTitle}
        </h2>
        <p className="hd-dialog__text" id={bodyId}>
          {TASK_OVERFLOW_COPY.takeoverDialogBody(accessLabel)}
        </p>
        <p id={TASK_TAKEOVER_CONFIRM_UNAVAILABLE_ID} className="hd-sr">
          {TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION}
        </p>
        <div className="hd-dialog__actions">
          <button
            ref={dismissRef}
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={onClose}
          >
            {TASK_OVERFLOW_COPY.takeoverCancel}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled
            aria-disabled="true"
            aria-describedby={TASK_TAKEOVER_CONFIRM_UNAVAILABLE_ID}
            title={TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION}
          >
            {TASK_OVERFLOW_COPY.takeoverConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
