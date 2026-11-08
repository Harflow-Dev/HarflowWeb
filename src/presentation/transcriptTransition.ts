import type { TranscriptObservation, TranscriptRow } from '../model'

export type TranscriptAction =
  | 'earlier'
  | 'new'
  | 'retry'
  | 'retry-request'
  | 'rebase'
  | 'read-more'

/** Pure specimen transitions for transcript history actions. */
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
  if (state.olderLoaded) return state
  const earlier: TranscriptRow = {
    id: 'row-earlier',
    sourceEpoch: state.sourceEpoch,
    windowEpoch: state.windowEpoch,
    occurrence: -1,
    seq: 5,
    type: 'message',
  }
  return {
    ...state,
    olderLoaded: true,
    rows: [earlier, ...state.rows],
    history: state.history === 'observed' ? 'drained' : state.history,
    liveMessage: 'Earlier captured rows loaded. Reading position retained.',
  }
}

function showNew(state: TranscriptObservation): TranscriptObservation {
  if (state.freshShown) return state
  const next: TranscriptRow = {
    id: 'row-new',
    sourceEpoch: state.sourceEpoch,
    windowEpoch: state.windowEpoch,
    occurrence: 3,
    seq: 10,
    type: 'message',
  }
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
    rows: [
      {
        id: 'row-current',
        sourceEpoch,
        windowEpoch,
        occurrence: 0,
        seq: 1,
        type: 'message',
      },
    ],
    liveMessage:
      'Current activity window loaded by request. Earlier coverage is unknown.',
  }
}
