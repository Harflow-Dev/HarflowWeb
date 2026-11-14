import type { RefObject } from 'react'
import type { TaskId, TaskObservation } from '../model'
import {
  TASK_OVERFLOW_COPY,
  type OverflowItemId,
  type TaskDialogOpener,
} from '../presentation'

type Handlers = {
  readonly onOpenDialog: (
    dialog: 'stop' | 'takeover',
    opener: TaskDialogOpener,
  ) => void
  readonly onOpenParentTask: (taskId: TaskId) => void
  readonly onAnnounce: (message: string) => void
  readonly onUnavailable: (label: string) => void
}

export function handleOverflowAction(
  id: OverflowItemId,
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
    case 'copyPath':
      void copyText(
        observation.repository?.path ?? '',
        TASK_OVERFLOW_COPY.copiedPath,
        handlers,
      )
      return
    case 'copyResume':
      handlers.onUnavailable(TASK_OVERFLOW_COPY.copyResume)
      return
    case 'openTerminal':
      handlers.onUnavailable(TASK_OVERFLOW_COPY.openTerminal)
      return
    case 'openFinder':
      handlers.onUnavailable(TASK_OVERFLOW_COPY.openFinder)
      return
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
  if (!text) {
    handlers.onAnnounce('Nothing to copy.')
    return
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('unavailable')
    await navigator.clipboard.writeText(text)
    handlers.onAnnounce(success)
  } catch {
    handlers.onAnnounce('Copy failed. Use your system copy command.')
  }
}

export function focusDialogOpener(
  opener: TaskDialogOpener | null,
  more: RefObject<HTMLButtonElement | null>,
  composer: RefObject<HTMLButtonElement | null>,
  banner: RefObject<HTMLButtonElement | null>,
): void {
  if (opener === 'composer-stop') {
    composer.current?.focus()
    return
  }
  if (opener === 'banner-stop') {
    banner.current?.focus()
    return
  }
  more.current?.focus()
}
