import type { TaskObservation } from '../model'
import { taskMessagingSupported } from './taskQueuedMessages'
import { TASK_COMPOSER } from './taskStatusCopy'
import type {
  TaskCommandChrome,
  TaskComposerStopMode,
  TaskStatusComposer,
} from './taskStatusTypes'

function settledComposer(showSendNow = false): TaskStatusComposer {
  return {
    placeholder: TASK_COMPOSER.placeholderDefault,
    locked: false,
    hint: TASK_COMPOSER.hintDefault,
    stopMode: 'hidden',
    showSendNow,
  }
}

function runningComposer(
  stopMode: TaskComposerStopMode,
  showSendNow: boolean,
): TaskStatusComposer {
  return {
    placeholder: TASK_COMPOSER.placeholderDefault,
    locked: false,
    hint: TASK_COMPOSER.hintDefault,
    stopMode,
    showSendNow,
  }
}

function lockedComposer(
  placeholder: string,
  stopMode: TaskComposerStopMode = 'hidden',
): TaskStatusComposer {
  return { placeholder, locked: true, hint: '', stopMode, showSendNow: false }
}

/** messaging.v1 unsupported: no placeholder, no hint, no Send now. */
function messagingLockedComposer(
  stopMode: TaskComposerStopMode,
): TaskStatusComposer {
  return { placeholder: '', locked: true, hint: '', stopMode, showSendNow: false }
}

export function composerFor(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusComposer {
  if (observation.statusRead.kind === 'unread') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedUnavailable)
  }

  if (chrome === 'continue-unknown') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedUnknown)
  }

  const status = observation.statusRead.status
  const messaging = taskMessagingSupported(observation)

  if (status === 'taken_over') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedTakenOver)
  }

  if (chrome === 'continue-starting') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedStarting)
  }

  if (status === 'pending') {
    return {
      ...lockedComposer(TASK_COMPOSER.placeholderPending, 'stop'),
      locked: true,
    }
  }

  if (status === 'running') {
    const stopMode: TaskComposerStopMode =
      chrome === 'stop-requested' ? 'stopping' : 'stop'
    // Explicit false locks (message-unsupported). Absent keeps the prior
    // follow-up shell; only messaging.v1 true adds Send now.
    if (observation.messagingV1 === false) {
      return messagingLockedComposer(stopMode)
    }
    return runningComposer(stopMode, messaging)
  }

  // Settled: messaging keeps the standard composer (no Send now).
  return settledComposer(false)
}
