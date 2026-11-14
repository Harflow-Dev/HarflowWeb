import type { TaskObservation } from '../model'
import { TASK_NOTICES } from './taskStatusCopy'
import { taskEngineStatus } from './taskObservation'
import type { TaskCommandChrome, TaskStatusNotice } from './taskStatusTypes'

export function noticeFor(
  observation: TaskObservation,
  chrome: TaskCommandChrome,
): TaskStatusNotice | null {
  if (observation.statusRead.kind === 'unread') {
    return {
      ...TASK_NOTICES.statusUnavailable,
      actionLabel: TASK_NOTICES.statusUnavailable.actionLabel,
    }
  }

  if (chrome === 'stop-requested' && taskEngineStatus(observation) === 'running') {
    return TASK_NOTICES.stopping
  }

  if (chrome === 'continue-started' && taskEngineStatus(observation) === 'running') {
    return TASK_NOTICES.continued
  }

  if (observation.settling) {
    return TASK_NOTICES.settling
  }

  if (
    observation.statusRead.kind === 'observed' &&
    observation.statusRead.status === 'completed' &&
    observation.exitObserved === false
  ) {
    return TASK_NOTICES.reconstructed
  }

  return null
}