/** Controllable promise helpers for deterministic tests — no timers. */

export type ControllablePromise<T> = {
  readonly promise: Promise<T>
  resolve(value: T): void
  reject(error: unknown): void
}

export function createControllablePromise<T>(): ControllablePromise<T> {
  let resolveFn: ((value: T) => void) | undefined
  let rejectFn: ((error: unknown) => void) | undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
  return {
    promise,
    resolve(value) {
      resolveFn?.(value)
    },
    reject(error) {
      rejectFn?.(error)
    },
  }
}
