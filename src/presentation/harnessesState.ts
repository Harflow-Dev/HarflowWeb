import type { HarnessesLoad } from '../model'

export type HarnessesScreenState = {
  readonly load: HarnessesLoad
  /**
   * Harness whose MCP approvals are expanded. Session state, so the same
   * harness stays expanded while the observation loads and when it is ready.
   */
  readonly expandedId: string | null
}

export function initialHarnessesState(): HarnessesScreenState {
  return { load: { kind: 'loading' }, expandedId: null }
}
