import { describe, expect, it } from 'vitest'
import { needsYouBadge } from '../../model'
import {
  emptyNeedsYouLoad,
  literalNeedsYouObservation,
  partialNeedsYouObservation,
  unavailableNeedsYouLoad,
  waitingNeedsYouLoad,
  waitingNeedsYouObservation,
} from './needsYouFixtures'

describe('needs you fixtures', () => {
  it('keeps approvals, questions, and coverage distinct', () => {
    const waiting = waitingNeedsYouObservation()
    expect(waiting.coverage).toBe('complete')
    expect(waiting.items.map((item) => item.kind)).toEqual([
      'approval',
      'approval',
      'question',
    ])
    expect(waiting.items[0]).toMatchObject({
      approveLabel: 'Approve once',
      exactAction: 'npm test -- --runInBand slot-release',
      context: { kind: 'task', taskId: 'task-slot-release' },
    })
    expect(waiting.items[1]).toMatchObject({
      approveLabel: 'Approve this publish',
      context: { kind: 'workflow', title: 'Nightly dependency audit' },
    })
    expect(waiting.items[2]).toMatchObject({
      kind: 'question',
      prompt: 'Which config should win when both are set?',
      context: { kind: 'task', title: 'Migrate events.jsonl reader', taskId: null },
    })
    expect(literalNeedsYouObservation().items[0]?.kind).toBe('question')
  })

  it('does not treat unknown coverage as zero requests', () => {
    expect(needsYouBadge(waitingNeedsYouLoad())).toEqual({ kind: 'count', count: 3 })
    expect(needsYouBadge(emptyNeedsYouLoad())).toEqual({ kind: 'clear' })
    expect(needsYouBadge({ kind: 'loading' })).toEqual({ kind: 'unknown' })
    expect(needsYouBadge(unavailableNeedsYouLoad())).toEqual({ kind: 'unknown' })
    expect(
      needsYouBadge({ kind: 'ready', observation: partialNeedsYouObservation() }),
    ).toEqual({ kind: 'partial', knownCount: 1 })
  })
})
