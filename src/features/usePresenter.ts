import { useEffect, useState, useSyncExternalStore } from 'react'

type Subscribable<T> = {
  subscribe(listener: (state: T) => void): () => void
  getState(): T
}

type Lifetime = {
  start(): void
  dispose(): void
}

export function usePresenter<T>(presenter: Subscribable<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => presenter.subscribe(onStoreChange),
    () => presenter.getState(),
    () => presenter.getState(),
  )
}

export function usePresenterLifetime(presenter: Lifetime): void {
  useEffect(() => {
    presenter.start()
    return () => {
      presenter.dispose()
    }
  }, [presenter])
}

/**
 * Local UI-only ephemeral note (unavailable nav, copy result), not engine
 * state. Newest wins: every `show` replaces the note, restarts the timer and
 * bumps `nonce`, so an identical repeat is still a new announcement.
 */
export function useEphemeralNote<T = string>(
  timeoutMs = 4000,
): {
  readonly note: T | null
  readonly nonce: number
  readonly show: (value: T) => void
} {
  const [current, setCurrent] = useState<{
    readonly value: T | null
    readonly nonce: number
  }>({ value: null, nonce: 0 })
  useEffect(() => {
    if (current.value === null) return
    const id = window.setTimeout(
      () => setCurrent((prev) => ({ value: null, nonce: prev.nonce })),
      timeoutMs,
    )
    return () => window.clearTimeout(id)
  }, [current, timeoutMs])
  return {
    note: current.value,
    nonce: current.nonce,
    show(value) {
      setCurrent((prev) => ({ value, nonce: prev.nonce + 1 }))
    },
  }
}
