import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { TASK_PANE_ASIDE_ID } from '../components/TaskPaneTabs'

type Options = {
  readonly overlay: boolean
  readonly showPane: boolean
  readonly eventsFactsReveal: string | null
  readonly eventsFactsRevealSeq: number
  readonly taskId: string | null
  /** Changes when the pane body changes, so a pending focus is retried. */
  readonly paneContent: string
  /** A modal dialog or the More menu owns Escape. */
  readonly blocked: boolean
  readonly paneToggleRef: RefObject<HTMLButtonElement | null>
  readonly onToggleChangesPane: (open: boolean) => void
}

/**
 * Overlay pane focus: the opener is remembered when the overlay appears,
 * focus moves into the selected tab (or to the revealed facts group), and
 * Escape or any close returns focus to the opener, else the toggle. A chip
 * reveal focuses the matching group summary once it mounts, once per reveal.
 */
export function useTaskPaneOverlay(options: Options): void {
  useOverlayFocus(options)
  useOverlayEscape(options)
  useRevealFocus(options)
}

function useOverlayFocus(options: Options): void {
  const { overlay, showPane, eventsFactsReveal, paneToggleRef } = options
  const wasOverlay = useRef(false)
  const opener = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (overlay && !wasOverlay.current) {
      const active = document.activeElement
      opener.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null
    }
  }, [overlay])

  useEffect(() => {
    if (overlay) {
      wasOverlay.current = true
      if (eventsFactsReveal !== null) return
      document
        .querySelector<HTMLElement>(
          `#${TASK_PANE_ASIDE_ID} [role="tab"][aria-selected="true"]`,
        )
        ?.focus()
      return
    }
    if (!wasOverlay.current) return
    wasOverlay.current = false
    if (!showPane) {
      const target =
        opener.current?.isConnected === true
          ? opener.current
          : paneToggleRef.current
      opener.current = null
      target?.focus()
    }
  }, [overlay, showPane, eventsFactsReveal, paneToggleRef])
}

/** Escape closes the overlay unless another control already handled it. */
function useOverlayEscape(options: Options): void {
  const { overlay, blocked, onToggleChangesPane } = options
  useEffect(() => {
    if (!overlay || blocked) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      onToggleChangesPane(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [overlay, blocked, onToggleChangesPane])
}

/** Focus the revealed facts summary once per reveal, when it exists. */
function useRevealFocus(options: Options): void {
  const {
    showPane,
    eventsFactsReveal,
    eventsFactsRevealSeq,
    taskId,
    paneContent,
  } = options
  const focusedReveal = useRef<string | null>(null)
  useEffect(() => {
    if (!showPane || eventsFactsReveal === null) return
    const key = `${taskId}:${eventsFactsRevealSeq}`
    if (focusedReveal.current === key) return
    const summary = document.querySelector<HTMLElement>('[data-m05-focus]')
    if (!summary) return
    focusedReveal.current = key
    summary.focus({ preventScroll: true })
    summary.scrollIntoView?.({ block: 'nearest' })
  }, [showPane, eventsFactsReveal, eventsFactsRevealSeq, taskId, paneContent])
}
