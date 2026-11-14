import type { RefObject } from 'react'
import type { TaskId, TaskObservation } from '../model'
import {
  TASK_OVERFLOW_COPY,
  type OverflowActionId,
  type TaskDialogOpener,
} from '../presentation'

type Handlers = {
  readonly onOpenDialog: (
    dialog: 'stop' | 'takeover',
    opener: TaskDialogOpener,
  ) => void
  readonly onOpenParentTask: (taskId: TaskId) => void
  readonly onAnnounce: (message: string) => void
}

export function handleOverflowAction(
  id: OverflowActionId,
  observation: TaskObservation,
  handlers: Handlers,
): void {
  switch (id) {
    case 'stop':
      handlers.onOpenDialog('stop', 'more')
      return
    case 'takeover':
      handlers.onOpenDialog('takeover', 'more')
      return
    case 'openParent':
      if (observation.parent) {
        handlers.onOpenParentTask(observation.parent.taskId)
      }
      return
    case 'copyTaskId':
      void copyText(observation.taskId, TASK_OVERFLOW_COPY.copiedTaskId, handlers)
      return
    case 'copyPath': {
      // The menu is only drawn when a repository is recorded.
      const path = observation.repository?.path
      if (path !== undefined) {
        void copyText(path, TASK_OVERFLOW_COPY.copiedPath, handlers)
      }
      return
    }
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

async function copyText(
  text: string,
  success: string,
  handlers: Pick<Handlers, 'onAnnounce'>,
): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('unavailable')
    await navigator.clipboard.writeText(text)
    handlers.onAnnounce(success)
  } catch {
    handlers.onAnnounce('Copy failed. Use your system copy command.')
  }
}

/**
 * Restore focus after a dialog closes: the control that opened it, or More
 * when that control is gone (state changed while the dialog was open).
 */
export function focusDialogOpener(
  opener: TaskDialogOpener | null,
  more: RefObject<HTMLButtonElement | null>,
  composer: RefObject<HTMLButtonElement | null>,
  banner: RefObject<HTMLButtonElement | null>,
): void {
  const preferred =
    opener === 'composer-stop'
      ? composer.current
      : opener === 'banner-stop'
        ? banner.current
        : more.current
  const target = isFocusable(preferred) ? preferred : more.current
  target?.focus()
}

function isFocusable(
  node: HTMLButtonElement | null,
): node is HTMLButtonElement {
  return node !== null && node.isConnected && !node.disabled
}
