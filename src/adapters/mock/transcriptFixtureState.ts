import type { TranscriptObservation } from '../../model'
import { specimenRows } from './transcriptRowFixtures'

export type TranscriptMount =
  | 'observed'
  | 'loading'
  | 'partial'
  | 'unavailable'
  | 'integrity-failed'
  | 'reconnecting'
  | 'capacity'
  | 'events'

const ENVELOPE = {
  format: 'harflow.event',
  v: 1,
  product: 'harflow',
  product_version: '0.0.8',
  seq: 7,
  observed_at: '2026-11-04T10:00:00Z',
} as const

export const NORMALIZED_RECORD = {
  ...ENVELOPE,
  kind: 'tool_result',
  call_id: 'mock-call-1',
  ok: true,
  output_tail: 'Mock regression reproduced',
}

export const STUB_RECORD = {
  ...ENVELOPE,
  kind: 'future_kind',
  truncated: true,
  oversized: true,
  bytes: 20000,
}

export const RECORD_ORDERING = [
  { kind: 'assistant_text', seq: 7 },
  { kind: 'future_kind', seq: 7 },
  { kind: 'assistant_text', seq: 6 },
] as const

export function requestKindFor(
  mount: TranscriptMount,
): TranscriptObservation['request'] {
  if (mount === 'integrity-failed') return 'integrity-failed'
  if (mount === 'loading') return 'loading'
  if (mount === 'partial') return 'truncated'
  if (mount === 'unavailable') return 'unavailable'
  return 'sidecar'
}

export function historyKindFor(
  mount: TranscriptMount,
): TranscriptObservation['history'] {
  if (mount === 'events') return 'unknown'
  if (mount === 'integrity-failed') return 'partial'
  return mount
}

export function observationFields(
  mount: TranscriptMount,
): Pick<
  TranscriptObservation,
  | 'request'
  | 'history'
  | 'summaryCoverage'
  | 'captureUncertainty'
  | 'pendingSourceEpoch'
  | 'normalizedRecord'
  | 'stubRecord'
  | 'ordering'
  | 'rows'
> {
  const history = historyKindFor(mount)
  const showExtra = history === 'partial' || history === 'unknown'
  const showRecords = !['loading', 'unavailable'].includes(mount)
  return {
    request: requestKindFor(mount),
    history,
    summaryCoverage:
      mount === 'observed' || mount === 'capacity'
        ? 'observed'
        : mount === 'loading'
          ? 'loading'
          : 'unavailable',
    captureUncertainty: ![
      'observed',
      'capacity',
      'loading',
      'empty',
      'drained',
    ].includes(mount),
    // Reconnecting covers reconnect + source change without a catalog control.
    pendingSourceEpoch: mount === 'reconnecting' ? 'mock-source-b' : null,
    rows: specimenRows(mount),
    normalizedRecord: showRecords ? NORMALIZED_RECORD : null,
    stubRecord: showExtra ? STUB_RECORD : null,
    ordering: showExtra ? [...RECORD_ORDERING] : [],
  }
}
