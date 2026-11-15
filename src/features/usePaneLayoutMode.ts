import { useEffect, useState } from 'react'
import {
  paneLayoutMode,
  type TaskPaneLayoutMode,
} from '../presentation/taskPaneDefaults'

/**
 * Split vs overlay from the measured `.hd-main` width (detail column).
 * Defaults to split until the first measurement.
 */
export function usePaneLayoutMode(
  mainRef: { readonly current: HTMLElement | null },
): TaskPaneLayoutMode {
  const [mode, setMode] = useState<TaskPaneLayoutMode>('split')

  useEffect(() => {
    const node = mainRef.current
    if (!node) return
    const update = (width: number) => setMode(paneLayoutMode(width))
    update(node.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [mainRef])

  return mode
}
