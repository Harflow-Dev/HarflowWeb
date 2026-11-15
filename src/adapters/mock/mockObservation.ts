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

export type KeyedListener<K, T> = {
  key: K
  send: (load: T) => void
}

export function createKeyedObservation<K, T>(
  listeners: Set<KeyedListener<K, T>>,
  key: K,
  onUpdate: (load: T) => void,
  current: (key: K) => T,
): ObservationHandle {
  const id = asObservationId(`obs-${++observationSeq}`)
  let active = true
  const entry: KeyedListener<K, T> = {
    key,
    send(load) {
      if (active) onUpdate(load)
    },
  }
  listeners.add(entry)
  queueMicrotask(() => {
    if (active) onUpdate(current(key))
  })
  return {
    id,
    cancel() {
      active = false
      listeners.delete(entry)
    },
  }
}

/** A handle that never answers; for engine stubs that observe nothing. */
export function idleObservation(): ObservationHandle {
  return {
    id: asObservationId(`obs-${++observationSeq}`),
    cancel() {
      /* nothing to cancel */
    },
  }
}

/** One-shot observation: answers once on a microtask unless cancelled. */
export function createOneShotObservation<T>(
  onUpdate: (load: T) => void,
  answer: () => T,
): ObservationHandle {
  let active = true
  queueMicrotask(() => {
    if (active) onUpdate(answer())
  })
  return {
    id: asObservationId(`obs-${++observationSeq}`),
    cancel() {
      active = false
    },
  }
}
