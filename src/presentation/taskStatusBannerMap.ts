import type { TaskFailureExplanation, TaskObservation } from '../model'
import {
  TASK_BANNER_CAPTION,
  TASK_BANNER_COPY,
  TASK_CONTINUE_LABEL,
} from './taskStatusCopy'
import type {
  TaskCommandChrome,
  TaskStatusBanner,
} from './taskStatusTypes'

function failedBanner(failure: TaskFailureExplanation): TaskStatusBanner {
  return {
    tone: 'default',
    title: failure.title,
    body: [
      {
        kind: 'lastError',
        intro: failure.intro,
        error: failure.lastError,
      },
    ],
    actions: [
      { kind: 'continue', label: TASK_CONTINUE_LABEL },
      { kind: 'copyResume', label: 'Copy resume command' },
    ],
    caption: TASK_BANNER_CAPTION.failedContinue,
  }
}

function launchUnknownBanner(): TaskStatusBanner {
  return {
    tone: 'warning',
    title: TASK_BANNER_COPY.launchUnknownTitle,
    body: [{ kind: 'text', value: TASK_BANNER_COPY.launchUnknownBody }],
    actions: [
      {
        kind: 'checkNewTask',
        label: TASK_BANNER_COPY.launchUnknownAction,
      },
    ],
    caption: TASK_BANNER_CAPTION.launchUnknown,
  }
}

function continueRefusedBanner(reason: string): TaskStatusBanner {
  return {
    tone: 'warning',
    title: TASK_BANNER_COPY.continueRefusedTitle,
    body: [
      { kind: 'text', value: TASK_BANNER_COPY.continueRefusedIntro },
      { kind: 'lastError', intro: '', error: reason },
    ],
    actions: [
      { kind: 'newTask', label: 'New task' },
      { kind: 'copyResume', label: 'Copy resume command' },
    ],
  }
}

function supervisionBanner(observation: TaskObservation): TaskStatusBanner | null {
  if (observation.supervision === 'owner_lost') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.ownerLostTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.ownerLostBody }],
      actions: [
        { kind: 'stop', label: 'Stop task' },
        { kind: 'refresh', label: 'Refresh' },
      ],
    }
  }
  if (observation.supervision === 'unverified') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.unverifiedTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.unverifiedBody }],
      actions: [
        { kind: 'refresh', label: 'Refresh' },
        { kind: 'stop', label: 'Stop task' },
      ],
    }
  }
  return null
}

function terminalStatusBanner(
  observation: TaskObservation,
): TaskStatusBanner | null {
  if (observation.statusRead.kind === 'unread') return null
  const status = observation.statusRead.status

  if (status === 'failed' && observation.exitObserved === false) {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.unknownFailedTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.unknownFailedBody }],
      actions: [
        { kind: 'continue', label: TASK_CONTINUE_LABEL, disabled: true },
        { kind: 'copyResume', label: 'Copy resume command' },
        { kind: 'openEvents', label: 'Open Events' },
      ],
      caption: TASK_BANNER_CAPTION.unknownFailedContinue,
    }
  }

  if (status === 'failed' && observation.failure) {
    return failedBanner(observation.failure)
  }

  if (status === 'timed_out') {
    return {
      tone: 'default',
      title: TASK_BANNER_COPY.timedOutTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.timedOutBody }],
      actions: [
        { kind: 'continue', label: TASK_CONTINUE_LABEL },
        { kind: 'copyResume', label: 'Copy resume command' },
      ],
    }
  }

  if (status === 'cancelled') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.cancelledTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.cancelledBody }],
      actions: [{ kind: 'continue', label: TASK_CONTINUE_LABEL }],
    }
  }

  return null
}

export function bannerFor(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBanner | null {
  if (observation.statusRead.kind === 'unread') return null

  if (observation.continuationOutcome === 'unknown') {
    return launchUnknownBanner()
  }

  if (observation.continueRefusedReason) {
    return continueRefusedBanner(observation.continueRefusedReason)
  }

  if (chrome === 'continue-starting' && observation.failure) {
    return {
      tone: 'default',
      title: observation.failure.title,
      body: [
        {
          kind: 'lastError',
          intro: '',
          error: observation.failure.lastError,
        },
      ],
      actions: [{ kind: 'starting', label: 'Starting…', disabled: true }],
    }
  }

  return (
    supervisionBanner(observation) ?? terminalStatusBanner(observation)
  )
}