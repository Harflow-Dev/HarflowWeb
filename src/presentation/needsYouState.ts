import type { NeedsYouItem, NeedsYouLoad } from '../model'
import {
  EMPTY_NEEDS_YOU_CHROME,
  type NeedsYouChrome,
} from './needsYouChrome'

export type NeedsYouScreenState = {
  readonly load: NeedsYouLoad
  readonly chrome: NeedsYouChrome
  /** Cards drawn on screen (observation + settle-in-place). */
  readonly displayItems: readonly NeedsYouItem[]
}

export function initialNeedsYouState(): NeedsYouScreenState {
  return {
    load: { kind: 'loading' },
    chrome: EMPTY_NEEDS_YOU_CHROME,
    displayItems: [],
  }
}
