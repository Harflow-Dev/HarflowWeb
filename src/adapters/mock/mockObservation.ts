import { asObservationId, type ObservationHandle } from '../../model'

let observationSeq = 0

export function createObservation<T>(
  listeners: Set<(load: T) => void>,
  onUpdate: (load: T) => void,
  current: () => T,
): ObservationHandle {
  const id = asObservationId(`obs-${++observationSeq}`)
  let active = true
  const wrapped = (load: T) => {
    if (active) onUpdate(load)
  }
  listeners.add(wrapped)
  queueMicrotask(() => {
    if (active) onUpdate(current())
  })
  return {
    id,
    cancel() {
      active = false
      listeners.delete(wrapped)
    },
  }
}
