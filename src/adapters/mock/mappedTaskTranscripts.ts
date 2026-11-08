import type { TranscriptObservation, TranscriptRow } from '../../model'
import { transcriptObservationFor } from './transcriptFixtures'

export { slotReleaseTranscript } from './mappedSlotReleaseTranscript'

function rows(items: readonly TranscriptRow[]): readonly TranscriptRow[] {
  return items
}

export function preloadTranscript(): TranscriptObservation {
  const base = transcriptObservationFor('observed')
  return {
    ...base,
    assignmentText:
      'Review the Electron preload bridge for authority gaps.\nInclude notes on <script>alert("x")</script> as literal text — do not execute.',
    rows: rows([
      {
        id: 'row-preload',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 0,
        seq: 1,
        type: 'message',
        anchorId: 'anchor',
        title: 'Claude',
        body: 'Reviewing the preload bridge surface for authority gaps. Probe: <img src=x onerror=alert(1)> stays literal.',
      },
    ]),
    earlierPrototype: {
      id: 'row-earlier',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: -1,
      seq: 5,
      type: 'message',
      anchorId: 'earlier',
      title: 'Earlier captured activity',
      body: 'Read preload bridge notes from the prior turn.',
    },
    freshPrototype: {
      id: 'row-new',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: 3,
      seq: 10,
      type: 'message',
      anchorId: 'new',
      title: 'New captured activity',
      body: 'Preload bridge authority notes received.',
    },
  }
}

export function eventsReaderFailedTranscript(): TranscriptObservation {
  const base = transcriptObservationFor('partial')
  return {
    ...base,
    assignmentText:
      'Move the events.jsonl reader to the streaming parser and keep reading partially written trailing lines.',
    rows: rows([
      {
        id: 'row-failed',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 0,
        seq: 1,
        type: 'message',
        anchorId: 'anchor',
        title: 'Claude',
        body: "I'll look at how the reader is used before swapping the parser.",
      },
    ]),
    // This mock has no earlier or fresh page — do not reuse specimen rows.
    earlierPrototype: null,
    freshPrototype: null,
  }
}

export function retryBudgetDoneTranscript(): TranscriptObservation {
  const base = transcriptObservationFor('observed')
  return {
    ...base,
    assignmentText:
      'Add a retry budget to the delivery queue so a failing webhook stops after 5 attempts per hour instead of retrying forever.',
    rows: rows([
      {
        id: 'row-done',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 0,
        seq: 1,
        type: 'message',
        anchorId: 'anchor',
        title: 'Claude',
        body: "I'll read the delivery queue and its tests first.",
      },
      {
        id: 'row-pytest-queue',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 1,
        seq: 2,
        type: 'tool_result',
        anchorId: 'tool',
        title: 'Claude',
        body: '',
        toolSummary: 'Ran pytest tests/test_queue.py',
        toolBody: '............\n11 passed in 2.04s',
        disclosure: 'tool-pytest-queue',
      },
    ]),
    // This mock has no earlier or fresh page — do not reuse specimen rows.
    earlierPrototype: null,
    freshPrototype: null,
  }
}
