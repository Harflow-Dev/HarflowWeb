import type { TranscriptObservation } from '../model'

/**
 * Fold a fresh observation into the retained reading window.
 * Request text, coverage, totals and status come from `incoming`.
 * Locally loaded rows and an explicit rebase stay until replaced by reading actions.
 * Read more prefix is kept across live snapshots only for the same truncated or
 * unverified request body.
 */
export function mergeTranscriptObservation(
  incoming: TranscriptObservation,
  retained: TranscriptObservation | null,
): TranscriptObservation {
  if (!retained) return incoming

  const retainReadMorePrefix =
    (incoming.request === 'truncated' || incoming.request === 'unverified') &&
    incoming.request === retained.request &&
    incoming.assignmentText === retained.assignmentText
  const requestMaxBytes = retainReadMorePrefix
    ? Math.max(incoming.requestMaxBytes, retained.requestMaxBytes)
    : incoming.requestMaxBytes

  const keepWindow =
    retained.currentWindow || retained.olderLoaded || retained.freshShown

  if (!keepWindow) {
    return {
      ...incoming,
      requestMaxBytes,
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
    requestMaxBytes,
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
