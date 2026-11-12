import { useEffect, useState, type KeyboardEvent } from 'react'

type Props = {
  readonly children: string
}

/**
 * Top-bar meta. Both forms are rendered and CSS (`@container hd-main`) picks
 * one, so a narrow window never flashes the wide form first and the hidden
 * form (`display: none`) stays out of the accessibility tree.
 *
 * Wide main column: the tertiary caption. Narrow main column (<= 800px, which
 * includes the 1000 x 620 preview frame): a focusable dot whose text shows on
 * hover and keyboard focus (HarflowDesign minimum window, 246cc97).
 */
export function TopbarMeta({ children }: Props) {
  return (
    <>
      <span className="hd-topbar__meta hw-topbar-meta__full">{children}</span>
      <CompactMeta text={children} />
    </>
  )
}

function CompactMeta({ text }: { readonly text: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Hover-only reveal has no focus, so keydown never reaches the element.
  // Listen on the document only while the pointer is over the dot.
  useEffect(() => {
    if (!hovered || dismissed) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setDismissed(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [hovered, dismissed])

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'Escape' || dismissed) return
    setDismissed(true)
    event.stopPropagation()
  }

  return (
    <span
      className={`hd-topbar__meta hw-topbar-meta__compact${dismissed ? ' is-dismissed' : ''}`}
      tabIndex={0}
      role="note"
      onKeyDown={onKeyDown}
      onMouseEnter={() => {
        setHovered(true)
        setDismissed(false)
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setDismissed(false)}
    >
      <span className="hw-topbar-meta__dot" aria-hidden="true" />
      <span className="hd-sr hw-topbar-meta__tip">{text}</span>
    </span>
  )
}
