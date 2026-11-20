import { useEffect, useRef, type RefObject } from 'react'

export function useFocusResult(
  focusResultSeq: number,
  resultRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (focusResultSeq <= 0) return
    ;(resultRef.current ?? rootRef.current)?.focus()
  }, [focusResultSeq, resultRef, rootRef])
}

export function useNeedsYouCardRefs() {
  const rootRef = useRef<HTMLElement | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)
  return { rootRef, resultRef }
}
