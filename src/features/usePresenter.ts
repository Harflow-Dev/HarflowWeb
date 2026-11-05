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

/** Local UI-only ephemeral note (unavailable nav), not engine state. */
export function useEphemeralNote(timeoutMs = 4000): {
  readonly note: string | null
  readonly show: (value: string) => void
} {
  const [note, setNote] = useState<string | null>(null)
  useEffect(() => {
    if (note === null) return
    const id = window.setTimeout(() => setNote(null), timeoutMs)
    return () => window.clearTimeout(id)
  }, [note, timeoutMs])
  return {
    note,
    show(value) {
      setNote(value)
    },
  }
}
