import type { TranscriptObservation } from '../model'
import { SPECIMEN_ROW_FACTORY } from './transcriptRowBuilders'

export type TranscriptAction =
  | 'earlier'
  | 'new'
  | 'retry'
  | 'retry-request'
  | 'rebase'
  | 'read-more'

const rows = SPECIMEN_ROW_FACTORY

/** Pure specimen transitions for local reading actions. */
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
  return {
    ...state,
    olderLoaded: true,
    rows: [rows.earlier(state.sourceEpoch, state.windowEpoch), ...state.rows],
    history: state.history === 'observed' ? 'drained' : state.history,
    liveMessage: 'Earlier captured rows loaded. Reading position retained.',
  }
}

function showNew(state: TranscriptObservation): TranscriptObservation {
  if (state.freshShown) return state
  return {
    ...state,
    freshShown: true,
    rows: [...state.rows, rows.fresh(state.sourceEpoch, state.windowEpoch)],
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
    rows: [rows.current(sourceEpoch, windowEpoch)],
    liveMessage:
      'Current activity window loaded by request. Earlier coverage is unknown.',
  }
}
