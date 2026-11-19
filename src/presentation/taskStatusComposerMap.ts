import type { MessagingCapabilityLoad, TaskObservation } from '../model'
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
  messaging: MessagingCapabilityLoad,
): TaskStatusComposer {
  if (observation.statusRead.kind === 'unread') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedUnavailable)
  }

  if (chrome === 'continue-unknown') {
    return lockedComposer(TASK_COMPOSER.placeholderLockedUnknown)
  }

  const status = observation.statusRead.status

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
    // An engine that reports no messaging.v1 locks the follow-up input. While
    // the capability is unobserved the prior shell stays. Send now needs the
    // capability and a status read that carries the messages ledger.
    // OPEN DESIGN CONFLICT: the ledger condition is mock-only (see
    // docs/review-notes.md, "Open design conflict: Send now").
    if (messaging.kind === 'ready' && !messaging.supported) {
      return messagingLockedComposer(stopMode)
    }
    const showSendNow =
      messaging.kind === 'ready' && observation.messages !== undefined
    return runningComposer(stopMode, showSendNow)
  }

  // Settled: messaging keeps the standard composer (no Send now).
  return settledComposer(false)
}
