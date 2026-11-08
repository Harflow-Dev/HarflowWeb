import type { TranscriptObservation, TranscriptRow } from '../../model'
import { transcriptObservationFor } from './transcriptFixtures'

const PYTEST_BODY = `FAILED tests/test_slots.py::test_release_frees_slot[7] - AssertionError: waiter still blocked
FAILED tests/test_slots.py::test_release_frees_slot[15] - AssertionError: waiter still blocked
2 failed, 18 passed in 38.52s`

/** Mapped sidebar running task — prior task/running content on the new surface. */
export function slotReleaseTranscript(): TranscriptObservation {
  const base = transcriptObservationFor('observed')
  return {
    ...base,
    assignmentText:
      'The test_release_frees_slot test in tests/test_slots.py fails about one run in ten. Find out why and fix it without adding sleeps.',
    rows: slotReleaseRows(),
    earlierPrototype: {
      id: 'row-earlier',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: -1,
      seq: 5,
      type: 'message',
      anchorId: 'earlier',
      title: 'Earlier captured activity',
      body: 'Read slot release implementation.',
    },
  }
}

function msg(
  id: string,
  occurrence: number,
  seq: number,
  anchorId: string,
  body: string,
): TranscriptRow {
  return {
    id,
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    occurrence,
    seq,
    type: 'message',
    anchorId,
    title: 'Claude',
    body,
  }
}

function slotReleaseRows(): readonly TranscriptRow[] {
  return [
    msg(
      'row-a1',
      0,
      1,
      'anchor',
      "I'll start with the slot release path and the test, then look for a race between the release call and the waiter being woken.",
    ),
    msg(
      'row-a2',
      1,
      2,
      'cause',
      'Found a likely cause. SlotPool.release() in harflow_mcp/slots.py sets the slot free and then notifies waiters outside the lock, so a waiter can wake, see the old count and go back to sleep. The test only passes when the notification lands first.',
    ),
    {
      id: 'row-tool',
      sourceEpoch: 'mock-source-a',
      windowEpoch: 0,
      occurrence: 2,
      seq: 3,
      type: 'tool_result',
      anchorId: 'tool',
      title: 'Claude',
      body: '',
      toolSummary: 'Ran pytest tests/test_slots.py -k release --count 20',
      toolBody: PYTEST_BODY,
      disclosure: 'tool-pytest',
    },
    msg('row-working', 3, 4, 'working', 'Running tests…'),
  ]
}
