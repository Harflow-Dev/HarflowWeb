import {
  observedEngineStatus,
  type EngineTaskStatus,
  type TaskObservation,
} from '../model'

export function taskEngineStatus(
  observation: TaskObservation,
): EngineTaskStatus | null {
  return observedEngineStatus(observation.statusRead)
}

/** True while the engine reports an active run (not pending or taken over). */
export function taskIsLiveRun(observation: TaskObservation): boolean {
  const status = taskEngineStatus(observation)
  return status === 'running'
}

export function taskIsSettled(observation: TaskObservation): boolean {
  const status = taskEngineStatus(observation)
  if (status === null) return false
  return status !== 'running' && status !== 'pending'
}

export function taskShowsSummary(observation: TaskObservation): boolean {
  return (
    taskEngineStatus(observation) === 'completed' &&
    observation.summary !== undefined
  )
}