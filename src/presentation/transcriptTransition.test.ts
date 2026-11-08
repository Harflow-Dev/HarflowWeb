import { describe, expect, it } from 'vitest'
import type { TranscriptObservation, TranscriptRow } from '../model'
import { transitionTranscript } from './transcriptTransition'
import { mergeTranscriptObservation } from './transcriptMerge'

function prototype(
  id: string,
  body: string,
  extras: Partial<TranscriptRow> = {},
): TranscriptRow {
  return {
    id,
    sourceEpoch: 'mock-source-a',
    windowEpoch: 0,
    occurrence: 0,
    seq: 1,
    type: 'message',
    anchorId: id,
    title: 'Title',
    body,
    ...extras,
  }
}

function base(overrides: Partial<TranscriptObservation> = {}): TranscriptObservation {
  return {
    request: 'sidecar',
    assignmentText: 'Assignment',
    requestMaxBytes: 64,
    history: 'observed',
    summaryCoverage: 'observed',
    captureUncertainty: false,
    sourceEpoch: 'mock-source-a',
    pendingSourceEpoch: null,
    windowEpoch: 0,
    rows: [
      prototype('row-a', 'First', { occurrence: 0, seq: 7, anchorId: 'anchor' }),
      prototype('row-b', '', {
        occurrence: 1,
        seq: 8,
        type: 'tool_result',
        anchorId: 'tool',
        toolSummary: 'Ran tool',
        toolBody: 'out',
        disclosure: 'tool-1',
      }),
    ],
    olderLoaded: false,
    freshShown: false,
    currentWindow: false,
    liveMessage: '',
    recoveredMessage: 'Mock recovery text: validation was requested.',
    normalizedRecord: null,
    stubRecord: null,
    ordering: [],
    earlierPrototype: prototype('row-earlier', 'Task-specific earlier', {
      occurrence: -1,
      seq: 5,
      anchorId: 'earlier',
    }),
    freshPrototype: prototype('row-new', 'Task-specific fresh', {
      occurrence: 3,
      seq: 10,
      anchorId: 'new',
    }),
    currentWindowPrototype: prototype('row-current', 'Current window', {
      anchorId: 'new',
    }),
    ...overrides,
  }
}

describe('transitionTranscript', () => {
  it('does not swap rows on pending source change until rebase', () => {
    const before = base({
      history: 'reconnecting',
      pendingSourceEpoch: 'mock-source-b',
      captureUncertainty: true,
      summaryCoverage: 'unavailable',
    })
    expect(before.rows.map((row) => row.id)).toEqual(['row-a', 'row-b'])
    const afterRetry = transitionTranscript(before, 'retry')
    expect(afterRetry.rows.map((row) => row.id)).toEqual(['row-a', 'row-b'])
    const rebased = transitionTranscript(before, 'rebase')
    expect(rebased.currentWindow).toBe(true)
    expect(rebased.pendingSourceEpoch).toBeNull()
    expect(rebased.sourceEpoch).toBe('mock-source-b')
    expect(rebased.rows.map((row) => row.id)).toEqual(['row-current'])
  })

  it('loads earlier from the observation prototype, not shared specimen text', () => {
    const before = base({
      earlierPrototype: prototype('row-earlier', 'Preload earlier notes', {
        occurrence: -1,
        seq: 5,
        anchorId: 'earlier',
      }),
    })
    const next = transitionTranscript(before, 'earlier')
    expect(next.rows[0]?.body).toBe('Preload earlier notes')
    expect(next.rows[0]?.body).not.toContain('slot release')
  })

  it('retains rows across reconnect retry', () => {
    const before = base({ history: 'reconnecting', captureUncertainty: true })
    const next = transitionTranscript(before, 'retry')
    expect(next.rows).toEqual(before.rows)
    expect(next.liveMessage).toContain('Cached rows retained')
  })
})

describe('mergeTranscriptObservation', () => {
  it('keeps loaded earlier rows when a reconnect observation arrives', () => {
    const observed = base()
    const withEarlier = transitionTranscript(observed, 'earlier')
    const reconnect = base({
      history: 'reconnecting',
      pendingSourceEpoch: 'mock-source-b',
      captureUncertainty: true,
      summaryCoverage: 'unavailable',
    })
    const merged = mergeTranscriptObservation(reconnect, withEarlier)
    expect(merged.rows[0]?.body).toBe('Task-specific earlier')
    expect(merged.olderLoaded).toBe(true)
    expect(merged.history).toBe('reconnecting')
    expect(merged.pendingSourceEpoch).toBe('mock-source-b')
  })

  it('takes withheld request from the new observation while keeping rows', () => {
    const withEarlier = transitionTranscript(base(), 'earlier')
    const integrity = base({
      request: 'integrity-failed',
      assignmentText: 'secret assignment must not show',
    })
    const merged = mergeTranscriptObservation(integrity, withEarlier)
    expect(merged.request).toBe('integrity-failed')
    expect(merged.rows[0]?.anchorId).toBe('earlier')
  })

  it('keeps an explicit rebase window across a later observation', () => {
    const rebased = transitionTranscript(
      base({ pendingSourceEpoch: 'mock-source-b' }),
      'rebase',
    )
    const later = base({ summaryCoverage: 'unavailable' })
    const merged = mergeTranscriptObservation(later, rebased)
    expect(merged.currentWindow).toBe(true)
    expect(merged.rows.map((row) => row.id)).toEqual(['row-current'])
    expect(merged.summaryCoverage).toBe('unavailable')
  })

  it('keeps a new pending source after rebase when it differs from the adopted one', () => {
    const rebased = transitionTranscript(
      base({ pendingSourceEpoch: 'mock-source-b' }),
      'rebase',
    )
    expect(rebased.sourceEpoch).toBe('mock-source-b')
    expect(rebased.pendingSourceEpoch).toBeNull()
    const withC = mergeTranscriptObservation(
      base({
        history: 'reconnecting',
        pendingSourceEpoch: 'mock-source-c',
        captureUncertainty: true,
        summaryCoverage: 'unavailable',
      }),
      rebased,
    )
    expect(withC.currentWindow).toBe(true)
    expect(withC.sourceEpoch).toBe('mock-source-b')
    expect(withC.pendingSourceEpoch).toBe('mock-source-c')
    expect(withC.rows.map((row) => row.id)).toEqual(['row-current'])
  })

  it('clears a pending source after rebase when it matches the adopted one', () => {
    const rebased = transitionTranscript(
      base({ pendingSourceEpoch: 'mock-source-b' }),
      'rebase',
    )
    const withSame = mergeTranscriptObservation(
      base({
        history: 'reconnecting',
        pendingSourceEpoch: 'mock-source-b',
        captureUncertainty: true,
        summaryCoverage: 'unavailable',
      }),
      rebased,
    )
    expect(withSame.pendingSourceEpoch).toBeNull()
    expect(withSame.currentWindow).toBe(true)
  })
})
