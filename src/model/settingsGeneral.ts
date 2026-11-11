/**
 * Settings General facts: Harflow runtime readiness and task store
 * compatibility. The two are independent. Unknown stays unknown and is never
 * shown as ready or compatible. Fixture facts, not a host probe.
 */

export type RuntimeFact =
  | { readonly kind: 'ready'; readonly version: string }
  | { readonly kind: 'unknown' }

export type TaskStoreFact =
  | { readonly kind: 'compatible' }
  | { readonly kind: 'unknown' }

export type SettingsGeneralObservation = {
  readonly runtime: RuntimeFact
  readonly taskStore: TaskStoreFact
}

export type SettingsGeneralLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: SettingsGeneralObservation }
