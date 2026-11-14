import {
  observedEngineStatus,
  type EngineTaskStatus,
  type TaskObservation,
  type TaskSupervision,
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

/** Supervision applies only while the engine reports the run as running. */
export function runningSupervision(
  observation: TaskObservation,
): TaskSupervision | null {
  if (taskEngineStatus(observation) !== 'running') return null
  return observation.supervision ?? null
}

/** Badge clock: mm:ss, or h:mm:ss from one hour (undesigned beyond 59:59). */
export function formatElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = whole % 60
  const two = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`
}
