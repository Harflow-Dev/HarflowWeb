import { useLayoutEffect, useState } from 'react'
import {
  paneLayoutMode,
  type TaskPaneLayoutMode,
} from '../presentation/taskPaneDefaults'

/**
 * Split vs overlay from the detail width: the `.hd-main` element's
 * `clientWidth`, which is the frame width minus the sidebar (or rail), the
 * same quantity the 900 threshold is defined on. Measured synchronously in a
 * layout effect so a wrong-mode frame never paints; a non-positive width (no
 * layout yet) keeps the current mode.
 */
export function usePaneLayoutMode(
  main: HTMLElement | null,
): TaskPaneLayoutMode {
  const [mode, setMode] = useState<TaskPaneLayoutMode>('split')

  useLayoutEffect(() => {
    if (!main) return
    const update = () => {
      const width = main.clientWidth
      if (width > 0) setMode(paneLayoutMode(width))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(main)
    return () => observer.disconnect()
  }, [main])

  return mode
}
