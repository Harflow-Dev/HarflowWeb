import type { TranscriptObservation, TranscriptRow } from '../model'

export type TranscriptAction =
  | 'earlier'
  | 'new'
  | 'retry'
  | 'retry-request'
  | 'rebase'
  | 'read-more'

/** Pure reading-window transitions. Row bodies come from observation prototypes. */
export function transitionTranscript(
  state: TranscriptObservation,
  action: TranscriptAction,
): TranscriptObservation {
  switch (action) {
    case 'read-more':
      return readMore(state)
    case 'earlier':
      return loadEarlier(state)
    case 'new':
      return showNew(state)
    case 'retry':
      return retryHistory(state)
    case 'retry-request':
      return retryRequest(state)
    case 'rebase':
      return rebaseCurrent(state)
    default:
      return state
  }
}

function readMore(state: TranscriptObservation): TranscriptObservation {
  if (state.requestMaxBytes >= 128) return state
  return { ...state, requestMaxBytes: state.requestMaxBytes * 2 }
}

function loadEarlier(state: TranscriptObservation): TranscriptObservation {
  if (state.olderLoaded || !state.earlierPrototype) return state
  const earlier = placePrototype(
    state.earlierPrototype,
    state.sourceEpoch,
    state.windowEpoch,
  )
  return {
    ...state,
    olderLoaded: true,
    rows: [earlier, ...state.rows],
    history: state.history === 'observed' ? 'drained' : state.history,
    liveMessage: 'Earlier captured rows loaded. Reading position retained.',
  }
}

function showNew(state: TranscriptObservation): TranscriptObservation {
  if (state.freshShown || !state.freshPrototype) return state
  const next = placePrototype(
    state.freshPrototype,
    state.sourceEpoch,
    state.windowEpoch,
  )
  return {
    ...state,
    freshShown: true,
    rows: [...state.rows, next],
    liveMessage: 'New captured activity shown by request.',
  }
}

function retryHistory(state: TranscriptObservation): TranscriptObservation {
  return {
    ...state,
    history: 'partial',
    captureUncertainty: true,
    summaryCoverage: 'unavailable',
    liveMessage:
      'Mock read reconnected. Cached rows retained; a history gap remains. Task execution was not restarted.',
  }
}

function retryRequest(state: TranscriptObservation): TranscriptObservation {
  return {
    ...state,
    request: 'unavailable',
    liveMessage:
      'Mock observation retry returned unavailable. No assignment text was admitted.',
  }
}

function rebaseCurrent(state: TranscriptObservation): TranscriptObservation {
  const sourceEpoch = state.pendingSourceEpoch ?? state.sourceEpoch
  const windowEpoch = state.windowEpoch + 1
  const prototype = state.currentWindowPrototype
  const row = prototype
    ? placePrototype(prototype, sourceEpoch, windowEpoch)
    : null
  return {
    ...state,
    history: 'partial',
    olderLoaded: false,
    freshShown: true,
    currentWindow: true,
    windowEpoch,
    sourceEpoch,
    pendingSourceEpoch: null,
    captureUncertainty:
      state.pendingSourceEpoch !== null || state.captureUncertainty,
    summaryCoverage:
      state.pendingSourceEpoch !== null
        ? 'unavailable'
        : state.summaryCoverage,
    rows: row ? [row] : [],
    liveMessage:
      'Current activity window loaded by request. Earlier coverage is unknown.',
  }
}

function placePrototype(
  prototype: TranscriptRow,
  sourceEpoch: string,
  windowEpoch: number,
): TranscriptRow {
  return { ...prototype, sourceEpoch, windowEpoch }
}
