import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'

function measurePlacement(anchor: HTMLElement): {
  readonly below: boolean
  readonly maxHeight: number
} {
  const area = anchor.closest('.hw-compose-area')
  const viewport =
    area instanceof HTMLElement
      ? area.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight }
  const a = anchor.getBoundingClientRect()
  const above = a.top - viewport.top - 16
  const spaceBelow = viewport.bottom - a.bottom - 16
  return {
    below: spaceBelow > above,
    maxHeight: Math.max(0, Math.min(400, Math.max(above, spaceBelow))),
  }
}

/** Places the options popover above or below; remeasures while open on resize. */
export function useTaskOptionsPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): { readonly below: boolean; readonly maxHeight: number } {
  const [below, setBelow] = useState(false)
  const [maxHeight, setMaxHeight] = useState(400)
  const depsKey = deps.map(String).join('\0')

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    if (!anchor) return

    function apply(): void {
      const el = anchorRef.current
      if (!el) return
      const next = measurePlacement(el)
      setBelow(next.below)
      setMaxHeight(next.maxHeight)
    }

    apply()
    const area = anchor.closest('.hw-compose-area')
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => apply())
        : null
    if (area instanceof HTMLElement) observer?.observe(area)
    observer?.observe(anchor)
    window.addEventListener('resize', apply)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [open, anchorRef, depsKey])

  return { below, maxHeight }
}

/** Escape and outside-click dismissal for the Task options popover. */
export function useTaskOptionsDismiss(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  onClose: (focusTrigger: boolean) => void,
): void {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose(true)
      triggerRef.current?.focus()
    }
    function onPointer(event: MouseEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!anchorRef.current?.contains(target)) onClose(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, anchorRef, triggerRef, onClose])
}
