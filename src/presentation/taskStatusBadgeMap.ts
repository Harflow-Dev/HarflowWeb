import type { EngineTaskStatus, TaskObservation } from '../model'
import { formatElapsed, runningSupervision } from './taskObservation'
import type { TaskCommandChrome, TaskStatusBadge } from './taskStatusTypes'

function elapsedSuffix(observation: TaskObservation): string {
  return observation.elapsedSeconds === undefined
    ? ''
    : ` ${formatElapsed(observation.elapsedSeconds)}`
}

function runningBadge(observation: TaskObservation): TaskStatusBadge {
  const supervision = runningSupervision(observation)
  if (supervision === 'owner_lost') {
    return { tone: 'warning', glyph: 'alert', label: 'Running · owner lost' }
  }
  if (supervision === 'unverified') {
    return { tone: 'warning', glyph: 'alert', label: 'Running · not verified' }
  }
  return {
    tone: 'running',
    glyph: 'spin',
    label: `Running${elapsedSuffix(observation)}`,
  }
}

function completedBadge(observation: TaskObservation): TaskStatusBadge {
  if (observation.exitObserved === false) {
    return { tone: 'done', glyph: 'check', label: 'Done · exit not observed' }
  }
  return {
    tone: 'done',
    glyph: 'check',
    label: `Done${elapsedSuffix(observation)}`,
  }
}

function failedBadge(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge {
  // A Continue in flight keeps the plain failed clock; the banner carries it.
  if (chrome !== 'continue-starting' && observation.exitObserved === false) {
    return { tone: 'failed', glyph: 'x', label: 'Failed · exit not observed' }
  }
  return {
    tone: 'failed',
    glyph: 'x',
    label: `Failed${elapsedSuffix(observation)}`,
  }
}

function badgeForEngineStatus(
  status: EngineTaskStatus,
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge {
  const elapsed = elapsedSuffix(observation)
  switch (status) {
    case 'running':
      return runningBadge(observation)
    case 'completed':
      return completedBadge(observation)
    case 'failed':
      return failedBadge(observation, chrome)
    case 'timed_out':
      return { tone: 'failed', glyph: 'clock', label: `Timed out${elapsed}` }
    case 'cancelled':
      return { tone: 'neutral', glyph: 'stop', label: `Cancelled${elapsed}` }
    case 'taken_over':
      return {
        tone: 'neutral',
        glyph: 'stop',
        label: `Cancelled${elapsed} · taken over`,
      }
    case 'pending':
      return { tone: 'neutral', glyph: 'queued', label: 'Pending' }
    default: {
      const unreachable: never = status
      return unreachable
    }
  }
}

export function badgeForStatus(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge {
  if (observation.statusRead.kind === 'unread') {
    return { tone: 'neutral', glyph: 'alert', label: 'Status unavailable' }
  }
  return badgeForEngineStatus(observation.statusRead.status, observation, chrome)
}
