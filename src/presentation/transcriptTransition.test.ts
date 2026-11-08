import { describe, expect, it } from 'vitest'
import type { TranscriptObservation } from '../model'
import { transitionTranscript } from './transcriptTransition'

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
      {
        id: 'row-a',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 0,
        seq: 7,
        type: 'message',
        anchorId: 'anchor',
        title: 'Codex',
        body: 'First',
      },
      {
        id: 'row-b',
        sourceEpoch: 'mock-source-a',
        windowEpoch: 0,
        occurrence: 1,
        seq: 8,
        type: 'tool_result',
        anchorId: 'tool',
        title: 'Codex',
        body: '',
        toolSummary: 'Ran tool',
        toolBody: 'out',
        disclosure: 'tool-1',
      },
    ],
    olderLoaded: false,
    freshShown: false,
    currentWindow: false,
    liveMessage: '',
    recoveredMessage: 'Mock recovery text: validation was requested.',
    normalizedRecord: null,
    stubRecord: null,
    ordering: [],
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

  it('keeps existing rows until capacity rebase is chosen', () => {
    const before = base({ history: 'capacity', summaryCoverage: 'observed' })
    expect(before.rows.map((row) => row.id)).toEqual(['row-a', 'row-b'])
    const rebased = transitionTranscript(before, 'rebase')
    expect(rebased.currentWindow).toBe(true)
    expect(rebased.rows.map((row) => row.id)).toEqual(['row-current'])
  })

  it('retains rows across reconnect retry', () => {
    const before = base({ history: 'reconnecting', captureUncertainty: true })
    const next = transitionTranscript(before, 'retry')
    expect(next.rows).toEqual(before.rows)
    expect(next.liveMessage).toContain('Cached rows retained')
  })
})
