/**
 * Per-card submitting flag for Needs you, read from the ids the session
 * derives from its registries on every snapshot.
 */
import type { NeedsYouItem } from '../model'
import type { NeedsYouChrome } from './needsYouChrome'

export function needsYouCardSubmitting(
  item: NeedsYouItem,
  chrome: NeedsYouChrome,
): boolean {
  return chrome.submittingItemIds.includes(item.id)
}
