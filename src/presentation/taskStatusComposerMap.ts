import type { TaskObservation } from '../model'
import { TASK_COMPOSER } from './taskStatusCopy'
import type {
  TaskCommandChrome,
  TaskComposerStopMode,
  TaskStatusComposer,
} from './taskStatusTypes'

function settledComposer(): TaskStatusComposer {
  return {
    placeholder: TASK_COMPOSER.placeholderDefault,
    locked: false,
    hint: TASK_COMPOSER.hintDefault,
    stopMode: 'hidden',
  }
}

function runningComposer(stopMode: TaskComposerStopMode): TaskStatusComposer {
  return {
    placeholder: TASK_COMPOSER.placeholderDefault,
    locked: false,
    hint: TASK_COMPOSER.hintDefault,
    stopMode,
  }
}

function lockedComposer(
  placeholder: string,
  stopMode: TaskComposerStopMode = 'hidden',
): TaskStatusComposer {
  return { placeholder, locked: true, hint: '', stopMode }
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
    return runningComposer(stopMode)
  }

  return settledComposer()
}