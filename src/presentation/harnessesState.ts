import type { HarnessesLoad } from '../model'

export type HarnessesScreenState = {
  readonly load: HarnessesLoad
}

export function initialHarnessesState(): HarnessesScreenState {
  return { load: { kind: 'loading' } }
}
