import type { EngineTaskStatus, TaskObservation } from '../model'
import type { TaskCommandChrome, TaskStatusBadge } from './taskStatusTypes'

function elapsedSuffix(elapsedLabel: string | undefined): string {
  return elapsedLabel ? ` ${elapsedLabel}` : ''
}

function supervisionBadge(observation: TaskObservation): TaskStatusBadge | null {
  if (observation.supervision === 'owner_lost') {
    return {
      tone: 'warning',
      glyph: 'alert',
      label: 'Running · owner lost',
    }
  }
  if (observation.supervision === 'unverified') {
    return {
      tone: 'warning',
      glyph: 'alert',
      label: 'Running · not verified',
    }
  }
  return null
}

function outcomeBadge(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge | null {
  const elapsed = elapsedSuffix(observation.elapsedLabel)
  if (observation.statusRead.kind !== 'observed') return null
  const status = observation.statusRead.status
  if (status === 'completed') {
    if (observation.exitObserved === false) {
      return {
        tone: 'done',
        glyph: 'check',
        label: 'Done · exit not observed',
      }
    }
    return { tone: 'done', glyph: 'check', label: `Done${elapsed}` }
  }
  if (status === 'failed') {
    if (chrome === 'continue-starting') {
      return { tone: 'failed', glyph: 'x', label: `Failed${elapsed}` }
    }
    if (observation.exitObserved === false) {
      return {
        tone: 'failed',
        glyph: 'x',
        label: 'Failed · exit not observed',
      }
    }
    return { tone: 'failed', glyph: 'x', label: `Failed${elapsed}` }
  }
  return null
}

function badgeForEngineStatus(
  status: EngineTaskStatus,
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge {
  const outcome = outcomeBadge(observation, chrome)
  if (outcome) return outcome

  const elapsed = elapsedSuffix(observation.elapsedLabel)
  const simple: Partial<Record<EngineTaskStatus, TaskStatusBadge>> = {
    taken_over: {
      tone: 'neutral',
      glyph: 'stop',
      label: `Cancelled${elapsed} · taken over`,
    },
    pending: { tone: 'neutral', glyph: 'queued', label: 'Pending' },
    running: {
      tone: 'running',
      glyph: 'spin',
      label: `Running${elapsed}`,
    },
    timed_out: {
      tone: 'failed',
      glyph: 'clock',
      label: `Timed out${elapsed}`,
    },
    cancelled: {
      tone: 'neutral',
      glyph: 'stop',
      label: `Cancelled${elapsed}`,
    },
  }
  return simple[status] ?? { tone: 'neutral', glyph: 'none', label: 'Status unavailable' }
}

export function badgeForStatus(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusBadge {
  if (observation.statusRead.kind === 'unread') {
    return { tone: 'neutral', glyph: 'alert', label: 'Status unavailable' }
  }

  return (
    supervisionBadge(observation) ??
    badgeForEngineStatus(observation.statusRead.status, observation, chrome)
  )
}