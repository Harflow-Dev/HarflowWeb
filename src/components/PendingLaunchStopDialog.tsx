import { useEffect, useRef } from 'react'
import type { PendingLaunchId } from '../model'
import { PENDING_COPY } from '../presentation/pendingLaunchCopy'

type Props = {
  readonly launchId: PendingLaunchId
  readonly onClose: () => void
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const REQUEST_STOP_UNAVAILABLE_ID = 'pending-request-stop-unavailable'

/**
 * Stop confirmation for a pending launch. App-level scrim; caller makes
 * sidebar and main inert. Focus starts on Cancel; Escape closes; Tab stays
 * inside. Request Stop stays unavailable in this mock.
 */
export function PendingLaunchStopDialog({ launchId, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    dismissRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [
        ...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
      ]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        return
      }
      const active = document.activeElement
      if (first === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="hd-scrim hd-pending-scrim">
      <div
        ref={dialogRef}
        className="hd-dialog hd-pending-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-stop-title"
        aria-describedby="pending-stop-copy"
      >
        <h2 className="hd-dialog__title" id="pending-stop-title">
          {PENDING_COPY.stopConfirmHeading}
        </h2>
        <p className="hd-dialog__text" id="pending-stop-copy">
          {PENDING_COPY.stopConfirmLead}
        </p>
        <p className="hd-dialog__text hd-mono">{launchId}</p>
        <p className="hd-dialog__text">{PENDING_COPY.stopConfirmDetail}</p>
        <p id={REQUEST_STOP_UNAVAILABLE_ID} className="hd-sr">
          {PENDING_COPY.requestStopUnavailable}
        </p>
        <div className="hd-dialog__actions">
          <button
            ref={dismissRef}
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={onClose}
          >
            {PENDING_COPY.cancel}
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--danger"
            disabled
            aria-disabled="true"
            aria-describedby={REQUEST_STOP_UNAVAILABLE_ID}
            title={PENDING_COPY.requestStopUnavailable}
          >
            {PENDING_COPY.requestStop}
          </button>
        </div>
      </div>
    </div>
  )
}
