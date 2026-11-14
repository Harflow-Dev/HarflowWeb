import type { TaskFailureExplanation, TaskObservation } from '../model'
import { runningSupervision } from './taskObservation'
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
      { kind: 'continue', label: TASK_CONTINUE_LABEL, variant: 'secondary' },
      { kind: 'copyResume', label: 'Copy resume command', variant: 'ghost' },
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
        variant: 'secondary',
      },
    ],
    caption: TASK_BANNER_CAPTION.launchUnknown,
  }
}

function supervisionBanner(observation: TaskObservation): TaskStatusBanner | null {
  const supervision = runningSupervision(observation)
  if (supervision === 'owner_lost') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.ownerLostTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.ownerLostBody }],
      actions: [
        { kind: 'stop', label: 'Stop task', variant: 'danger' },
        { kind: 'refresh', label: 'Refresh', variant: 'ghost' },
      ],
    }
  }
  if (supervision === 'unverified') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.unverifiedTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.unverifiedBody }],
      actions: [
        { kind: 'refresh', label: 'Refresh', variant: 'secondary' },
        { kind: 'stop', label: 'Stop task', variant: 'danger' },
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
        {
          kind: 'continue',
          label: TASK_CONTINUE_LABEL,
          variant: 'secondary',
          disabled: true,
        },
        { kind: 'copyResume', label: 'Copy resume command', variant: 'ghost' },
        { kind: 'openEvents', label: 'Open Events', variant: 'ghost' },
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
        { kind: 'continue', label: TASK_CONTINUE_LABEL, variant: 'secondary' },
        { kind: 'copyResume', label: 'Copy resume command', variant: 'ghost' },
      ],
    }
  }

  if (status === 'cancelled') {
    return {
      tone: 'warning',
      title: TASK_BANNER_COPY.cancelledTitle,
      body: [{ kind: 'text', value: TASK_BANNER_COPY.cancelledBody }],
      actions: [
        { kind: 'continue', label: TASK_CONTINUE_LABEL, variant: 'secondary' },
      ],
    }
  }

  return null
}

export function bannerFor(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBanner | null {
  if (observation.statusRead.kind === 'unread') return null

  if (chrome === 'continue-unknown') return launchUnknownBanner()

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
      actions: [
        {
          kind: 'starting',
          label: 'Starting…',
          variant: 'secondary',
          disabled: true,
        },
      ],
    }
  }

  return (
    supervisionBanner(observation) ?? terminalStatusBanner(observation)
  )
}