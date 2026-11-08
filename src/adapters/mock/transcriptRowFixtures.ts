import {
  TRANSCRIPT_TOOL_BODY,
  type TranscriptRow,
} from '../../model'
import type { TranscriptMount } from './transcriptFixtureState'

/** Specimen captured rows for Design 854caae transcript mounts. */
export function specimenRows(mount: TranscriptMount): readonly TranscriptRow[] {
  if (mount === 'loading' || mount === 'unavailable') return []
  // Sources keeps the tool disclosure in the transcript; the unsupported stub
  // lives only in the Events pane (Design 854caae rowsHtml + asideSectionsHtml).
  return [
    {
      id: 'row-a',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: 0,
      seq: 7,
      type: 'message',
      anchorId: 'anchor',
      title: 'Codex',
      body: 'I found the notification outside the lock. I will reproduce the race before changing it.',
    },
    {
      id: 'row-b',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: 1,
      seq: mount === 'events' ? 7 : 8,
      type: 'tool_result',
      anchorId: 'tool',
      title: 'Codex',
      body: '',
      toolSummary: 'Ran deterministic slot regression',
      toolBody: TRANSCRIPT_TOOL_BODY,
      disclosure: 'tool-regression',
    },
    {
      id: 'row-c',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: 2,
      seq: mount === 'events' ? 6 : 9,
      type: 'message',
      anchorId: 'validation-summary',
      title: 'Codex',
      body: 'The notification now runs under the lock. The focused regression passed in this mock transcript.',
    },
  ]
}

export function specimenEarlierPrototype(): TranscriptRow {
  return {
    id: 'row-earlier',
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    occurrence: -1,
    seq: 5,
    type: 'message',
    anchorId: 'earlier',
    title: 'Earlier captured activity',
    body: 'Read slot release implementation.',
  }
}

export function specimenFreshPrototype(): TranscriptRow {
  return {
    id: 'row-new',
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    occurrence: 3,
    seq: 10,
    type: 'message',
    anchorId: 'new',
    title: 'New captured activity',
    body: 'Focused validation result received.',
  }
}

export function specimenCurrentWindowPrototype(): TranscriptRow {
  return {
    id: 'row-current',
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    occurrence: 0,
    seq: 1,
    type: 'message',
    anchorId: 'new',
    title: 'Current activity window',
    body: 'This view now shows current captured activity. Earlier rows are outside this view.',
  }
}
