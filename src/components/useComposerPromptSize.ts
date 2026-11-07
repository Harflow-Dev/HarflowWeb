import { useLayoutEffect, useRef, type RefObject } from 'react'

const LINE_CAP = 6

/**
 * Sizes the New task prompt from one visual line up to a six-line cap, matching
 * HarflowDesign's centered-composer amendment (scrollHeight, soft wrap).
 */
export function useComposerPromptSize(
  ref: RefObject<HTMLTextAreaElement | null>,
  prompt: string,
): void {
  const lastWidthRef = useRef(0)
  const rafRef = useRef(0)

  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return

    function size(): void {
      const el = ref.current
      if (!el) return
      const style = window.getComputedStyle(el)
      const lineHeight = parseFloat(style.lineHeight) || 22
      const verticalExtra =
        (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0) +
        (parseFloat(style.borderTopWidth) || 0) +
        (parseFloat(style.borderBottomWidth) || 0)
      const cap = lineHeight * LINE_CAP + verticalExtra
      el.style.height = 'auto'
      const wanted = el.scrollHeight
      el.style.height = `${Math.min(wanted, cap)}px`
      el.style.overflowY = wanted > cap ? 'auto' : 'hidden'
    }

    size()
    lastWidthRef.current = input.getBoundingClientRect().width

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            const width = input.getBoundingClientRect().width
            if (width === lastWidthRef.current) return
            lastWidthRef.current = width
            if (!rafRef.current) {
              rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = 0
                size()
              })
            }
          })
        : null
    observer?.observe(input)

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      observer?.disconnect()
    }
  }, [ref, prompt])
}
