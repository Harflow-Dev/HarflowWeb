import type { TranscriptObservation } from '../model'

/**
 * Fold a fresh observation into the retained reading window.
 * Request text, coverage, totals and status come from `incoming`.
 * Locally loaded rows and an explicit rebase stay until replaced by reading actions.
 */
export function mergeTranscriptObservation(
  incoming: TranscriptObservation,
  retained: TranscriptObservation | null,
): TranscriptObservation {
  if (!retained) return incoming

  const keepWindow =
    retained.currentWindow || retained.olderLoaded || retained.freshShown

  if (!keepWindow) {
    return {
      ...incoming,
      liveMessage: '',
    }
  }

  const sourceEpoch = retained.currentWindow
    ? retained.sourceEpoch
    : incoming.sourceEpoch
  const pendingSourceEpoch = retained.currentWindow
    ? incoming.pendingSourceEpoch !== null &&
      incoming.pendingSourceEpoch !== sourceEpoch
      ? incoming.pendingSourceEpoch
      : null
    : incoming.pendingSourceEpoch

  return {
    ...incoming,
    liveMessage: '',
    rows: retained.rows,
    olderLoaded: retained.olderLoaded,
    freshShown: retained.freshShown,
    currentWindow: retained.currentWindow,
    sourceEpoch,
    windowEpoch: retained.currentWindow
      ? retained.windowEpoch
      : incoming.windowEpoch,
    pendingSourceEpoch,
  }
}
