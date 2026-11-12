import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from 'react'

type Props = {
  readonly children: string
}

/**
 * Top-bar meta. At a normal main width this matches the tertiary caption.
 * When the main column is narrow (1000 × 620 preview frame, or main ≤ 800px)
 * the caption drops first: a focusable dot keeps the text reachable on hover
 * and keyboard focus (HarflowDesign minimum window, cd606f0 / c147372).
 */
export function TopbarMeta({ children }: Props) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const compact = useNarrowMain(hostRef)

  if (!compact) {
    return (
      <span ref={hostRef} className="hd-topbar__meta">
        {children}
      </span>
    )
  }

  return (
    <span ref={hostRef} className="hd-topbar__meta">
      <CompactMeta text={children} />
    </span>
  )
}

function CompactMeta({ text }: { readonly text: string }) {
  const labelId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const root = rootRef.current
      if (!root) return
      if (!root.matches(':hover') && !root.contains(document.activeElement)) {
        return
      }
      setDismissed(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <span
      ref={rootRef}
      className={
        dismissed
          ? 'hw-topbar-meta__compact is-dismissed'
          : 'hw-topbar-meta__compact'
      }
      tabIndex={0}
      role="note"
      aria-labelledby={labelId}
      onMouseEnter={() => setDismissed(false)}
      onFocus={() => setDismissed(false)}
    >
      <span className="hw-topbar-meta__dot" aria-hidden="true" />
      <span id={labelId} className="hd-sr hw-topbar-meta__tip">
        {text}
      </span>
    </span>
  )
}

/** True inside the 1000×620 preview frame, or when `.hd-main` is ≤ 800px wide. */
function useNarrowMain(hostRef: RefObject<HTMLSpanElement | null>): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const measure = () => {
      if (host.closest('.hw-preview__app--minimum')) {
        setNarrow(true)
        return
      }
      const main = host.closest('.hd-main')
      if (!(main instanceof HTMLElement)) {
        setNarrow(false)
        return
      }
      const width = main.clientWidth
      setNarrow(width > 0 && width <= 800)
    }

    measure()
    const main = host.closest('.hd-main')
    if (!(main instanceof HTMLElement) || typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(main)
    return () => observer.disconnect()
  }, [hostRef])

  return narrow
}
