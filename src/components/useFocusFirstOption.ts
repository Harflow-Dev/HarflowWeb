import { useLayoutEffect, useRef } from 'react'

/** Focuses the first select when options open from the keyboard (detail === 0). */
export function useFocusFirstOption(open: boolean, optionsId: string) {
  const focusFirstRef = useRef(false)
  useLayoutEffect(() => {
    if (!open || !focusFirstRef.current) return
    focusFirstRef.current = false
    const first = document.querySelector(
      `#${optionsId} select`,
    ) as HTMLSelectElement | null
    first?.focus()
  }, [open, optionsId])
  return focusFirstRef
}
