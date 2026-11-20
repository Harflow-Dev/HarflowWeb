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
  /**
   * Mirror of the command object's in-flight key for the open card
   * (taskId\0requestId or runId\0token). The command object guards doubles.
   */
  readonly submittingKey: string | null
}

export function initialNeedsYouState(): NeedsYouScreenState {
  return {
    load: { kind: 'loading' },
    chrome: EMPTY_NEEDS_YOU_CHROME,
    displayItems: [],
    submittingKey: null,
  }
}
