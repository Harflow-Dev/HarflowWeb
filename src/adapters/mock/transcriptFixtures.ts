/**
 * Deterministic task/transcript-* fixtures from HarflowDesign 854caae
 * (v2/scripts/d2b-proposal.js createState + screens-transcript.js).
 * Mock-only — not a public ctl transcript protocol.
 */
import {
  asTaskId,
  TRANSCRIPT_REQUEST_TEXT,
  type TaskObservation,
  type TranscriptObservation,
} from '../../model'
import {
  observationFields,
  type TranscriptMount,
} from './transcriptFixtureState'
import {
  specimenCurrentWindowPrototype,
  specimenEarlierPrototype,
  specimenFreshPrototype,
} from './transcriptRowFixtures'

export type { TranscriptMount }

export const TRANSCRIPT_TASK_IDS: Record<TranscriptMount, ReturnType<typeof asTaskId>> =
  {
    observed: asTaskId('task-transcript-observed'),
    loading: asTaskId('task-transcript-loading'),
    partial: asTaskId('task-transcript-partial'),
    unavailable: asTaskId('task-transcript-unavailable'),
    'integrity-failed': asTaskId('task-transcript-integrity-failed'),
    reconnecting: asTaskId('task-transcript-reconnecting'),
    capacity: asTaskId('task-transcript-capacity'),
    events: asTaskId('task-transcript-sources'),
  }

export function transcriptObservationFor(
  mount: TranscriptMount,
): TranscriptObservation {
  const fields = observationFields(mount)
  return {
    ...fields,
    assignmentText: TRANSCRIPT_REQUEST_TEXT,
    requestMaxBytes: 64,
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    olderLoaded: false,
    freshShown: false,
    currentWindow: false,
    liveMessage: '',
    recoveredMessage: 'Mock recovery text: validation was requested.',
    earlierPrototype: specimenEarlierPrototype(),
    freshPrototype: specimenFreshPrototype(),
    currentWindowPrototype: specimenCurrentWindowPrototype(),
  }
}

export function transcriptTaskObservation(
  mount: TranscriptMount,
): TaskObservation {
  const running =
    mount === 'loading' || mount === 'reconnecting' || mount === 'capacity'
  const transcript = transcriptObservationFor(mount)
  const base = {
    taskId: TRANSCRIPT_TASK_IDS[mount],
    title: 'Fix slot release test',
    statusBadge: running ? 'Running' : 'Done',
    headerMeta: 'Codex · HarflowMCP',
    followUpPlaceholder: running
      ? 'Send a follow-up. It is delivered after the current turn.'
      : 'Continue this task',
    transcript,
    detailsPane: 'events' as const,
  }
  // Pinned transcript states do not draw a Summary block.
  if (running) return { ...base, status: 'running' }
  return { ...base, status: 'completed' }
}

export function transcriptTaskLoad(mount: TranscriptMount) {
  return {
    kind: 'ready' as const,
    observation: transcriptTaskObservation(mount),
  }
}
