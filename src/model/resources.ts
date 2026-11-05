import type { HarnessId } from './ids'

/** Task currently holding a harness slot (definition of occupancy, not a destination). */
export type ResourceSlotHolder = {
  readonly id: string
  readonly title: string
  /** Elapsed display from the specimen (e.g. 04:12). */
  readonly meta: string
}

/**
 * Installed harness with known capacity.
 * `used: 0` is a real observation — never invent zeros for unknown capacity.
 */
export type InstalledResourceHarness = {
  readonly kind: 'installed'
  readonly harnessId: HarnessId
  readonly label: string
  readonly capacity: number
  readonly used: number
  /** Waiters targeting this harness (drives badge + waiting meter cells). */
  readonly waitingCount: number
  readonly holders: readonly ResourceSlotHolder[]
}

/** Harness present in the catalog but not installed — no capacity/usage claim. */
export type NotInstalledResourceHarness = {
  readonly kind: 'not_installed'
  readonly harnessId: HarnessId
  readonly label: string
}

export type ResourceHarnessCard =
  | InstalledResourceHarness
  | NotInstalledResourceHarness

export type ResourceWaitingTask = {
  readonly id: string
  readonly title: string
  /** e.g. "Waiting for a Codex slot" */
  readonly detail: string
  /** e.g. "Waited 4m" */
  readonly waitedMeta: string
}

export type ResourcesObservation = {
  readonly harnesses: readonly ResourceHarnessCard[]
  readonly waiting: readonly ResourceWaitingTask[]
}

export type ResourcesLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | {
      readonly kind: 'ready'
      readonly observation: ResourcesObservation
    }
