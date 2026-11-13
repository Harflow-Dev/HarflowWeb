import {
  PARALLEL_GROUP_ACTION_EXPLANATION,
  PARALLEL_GROUP_ACTION_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'
import { useModalFocusTrap } from './useModalFocusTrap'

type Props = {
  readonly onClose: () => void
}

/**
 * Cancel-all confirmation. Rendered at app level so the scrim covers the
 * whole window; the caller makes the sidebar and main pane inert while it
 * is open. Focus starts on Cancel, Escape closes, Tab stays inside.
 * Confirm stays unavailable in the mock (no mutation).
 */
export function ParallelGroupCancelDialog({ onClose }: Props) {
  const { dialogRef, dismissRef } = useModalFocusTrap(onClose)

  return (
    <div className="hd-scrim hd-pl-scrim">
      <div
        ref={dialogRef}
        className="hd-dialog hd-pl-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pl-cancel-title"
      >
        <h2 className="hd-dialog__title" id="pl-cancel-title">
          Cancel every running task in this group?
        </h2>
        <p id={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID} className="hd-sr">
          {PARALLEL_GROUP_ACTION_EXPLANATION}
        </p>
        <div className="hd-dialog__actions">
          <button
            ref={dismissRef}
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--danger"
            disabled
            aria-disabled="true"
            aria-describedby={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID}
            title={PARALLEL_GROUP_ACTION_EXPLANATION}
          >
            Cancel all
          </button>
        </div>
      </div>
    </div>
  )
}
