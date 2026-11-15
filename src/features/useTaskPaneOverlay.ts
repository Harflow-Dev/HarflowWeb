import { useEffect, useRef, type RefObject } from 'react'
import { TASK_PANE_ASIDE_ID } from '../components/TaskPaneTabs'

/**
 * Overlay pane: focus selected tab on open; Escape closes and returns focus
 * to the toggle. Facts-chip reveal focuses the matching summary.
 */
export function useTaskPaneOverlay(options: {
  readonly overlay: boolean
  readonly showPane: boolean
  readonly eventsFactsReveal: string | null
  readonly paneToggleRef: RefObject<HTMLButtonElement | null>
  readonly onToggleChangesPane: (open: boolean) => void
}): void {
  const {
    overlay,
    showPane,
    eventsFactsReveal,
    paneToggleRef,
    onToggleChangesPane,
  } = options
  const wasOverlay = useRef(false)

  useEffect(() => {
    if (overlay) {
      document
        .querySelector<HTMLElement>(
          `#${TASK_PANE_ASIDE_ID} [role="tab"][aria-selected="true"]`,
        )
        ?.focus()
      wasOverlay.current = true
      return
    }
    if (wasOverlay.current && !showPane) {
      wasOverlay.current = false
      paneToggleRef.current?.focus()
    }
  }, [overlay, showPane, paneToggleRef])

  useEffect(() => {
    if (!overlay) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onToggleChangesPane(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [overlay, onToggleChangesPane])

  useEffect(() => {
    if (!showPane || eventsFactsReveal === null) return
    queueMicrotask(() => {
      document
        .querySelector<HTMLElement>('[data-m05-focus]')
        ?.focus({ preventScroll: true })
    })
  }, [showPane, eventsFactsReveal])
}
