import {
  asObservationId,
  type ObservationHandle,
  type StatisticsLoad,
  type StatisticsRangeId,
} from '../../model'

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

export type RangedStatisticsListener = {
  range: StatisticsRangeId
  send: (load: StatisticsLoad) => void
}

export function createRangedObservation(
  listeners: Set<RangedStatisticsListener>,
  range: StatisticsRangeId,
  onUpdate: (load: StatisticsLoad) => void,
  current: (range: StatisticsRangeId) => StatisticsLoad,
): ObservationHandle {
  const id = asObservationId(`obs-${++observationSeq}`)
  let active = true
  const entry: RangedStatisticsListener = {
    range,
    send(load) {
      if (active) onUpdate(load)
    },
  }
  listeners.add(entry)
  queueMicrotask(() => {
    if (active) onUpdate(current(range))
  })
  return {
    id,
    cancel() {
      active = false
      listeners.delete(entry)
    },
  }
}
