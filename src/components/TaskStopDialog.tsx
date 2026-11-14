import {
  TASK_OVERFLOW_COPY,
  TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION,
  TASK_STOP_CONFIRM_UNAVAILABLE_ID,
} from '../presentation'
import { useModalFocusTrap } from './useModalFocusTrap'

type Props = {
  readonly wontBeStoppedTitles: readonly string[]
  readonly onClose: () => void
}

/**
 * Stop confirmation. App-level scrim; caller makes sidebar and main inert.
 * Focus starts on Keep running; Escape closes; confirm stays unavailable.
 */
export function TaskStopDialog({ wontBeStoppedTitles, onClose }: Props) {
  const { dialogRef, dismissRef } = useModalFocusTrap(onClose)
  const titleId = 'task-stop-title'
  const leadId = 'task-stop-lead'

  return (
    <div className="hd-scrim hd-m05-scrim">
      <div
        ref={dialogRef}
        className="hd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={leadId}
      >
        <h2 className="hd-dialog__title" id={titleId}>
          {TASK_OVERFLOW_COPY.stopDialogTitle}
        </h2>
        <p className="hd-dialog__text" id={leadId}>
          {TASK_OVERFLOW_COPY.stopDialogLead}
        </p>
        <ul className="hd-m05-list hd-dialog__text">
          <li>{TASK_OVERFLOW_COPY.stopDialogFileStay}</li>
          <li>{TASK_OVERFLOW_COPY.stopDialogBackground}</li>
        </ul>
        {wontBeStoppedTitles.length > 0 ? (
          <div className="hd-m05-derived">
            <strong>{TASK_OVERFLOW_COPY.wontBeStoppedHeading}</strong>
            <p>{TASK_OVERFLOW_COPY.wontBeStoppedLead}</p>
            <ul className="hd-m05-list">
              {wontBeStoppedTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
            <p className="hd-faint">{TASK_OVERFLOW_COPY.wontBeStoppedCaption}</p>
          </div>
        ) : null}
        <p id={TASK_STOP_CONFIRM_UNAVAILABLE_ID} className="hd-sr">
          {TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION}
        </p>
        <div className="hd-dialog__actions">
          <button
            ref={dismissRef}
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={onClose}
          >
            {TASK_OVERFLOW_COPY.keepRunning}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--danger"
            disabled
            aria-disabled="true"
            aria-describedby={TASK_STOP_CONFIRM_UNAVAILABLE_ID}
            title={TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION}
          >
            {TASK_OVERFLOW_COPY.stopConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
