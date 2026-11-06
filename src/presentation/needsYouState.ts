import type { NeedsYouLoad } from '../model'

export type NeedsYouScreenState = {
  readonly load: NeedsYouLoad
}

export function initialNeedsYouState(): NeedsYouScreenState {
  return { load: { kind: 'loading' } }
}
