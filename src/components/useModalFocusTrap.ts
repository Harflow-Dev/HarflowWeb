import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Focus handling shared by app-level confirmation dialogs: focus starts on
 * the dismiss control, Escape closes, and Tab / Shift+Tab wrap inside the
 * dialog. Attach `dialogRef` to the dialog and `dismissRef` to its dismiss
 * button.
 */
export function useModalFocusTrap(onClose: () => void): {
  readonly dialogRef: RefObject<HTMLDivElement | null>
  readonly dismissRef: RefObject<HTMLButtonElement | null>
} {
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

  return { dialogRef, dismissRef }
}
