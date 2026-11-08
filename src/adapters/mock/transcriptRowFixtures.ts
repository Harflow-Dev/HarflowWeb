import {
  TRANSCRIPT_TOOL_BODY,
  type TranscriptRow,
} from '../../model'
import type { TranscriptMount } from './transcriptFixtureState'

/** Specimen captured rows for Design 854caae transcript mounts. */
export function specimenRows(mount: TranscriptMount): readonly TranscriptRow[] {
  if (mount === 'loading' || mount === 'unavailable') return []
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
      type: mount === 'events' ? 'unsupported' : 'tool_result',
      anchorId: mount === 'events' ? 'stub' : 'tool',
      title: mount === 'events' ? 'Unsupported record' : 'Codex',
      body:
        mount === 'events'
          ? 'No tool summary is inferred from this record.'
          : '',
      ...(mount === 'events'
        ? {}
        : {
            toolSummary: 'Ran deterministic slot regression',
            toolBody: TRANSCRIPT_TOOL_BODY,
            disclosure: 'tool-regression',
          }),
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
