import { describe, expect, it } from 'vitest'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import {
  asTaskId,
  type TaskChangesCapture,
  type TaskObservation,
} from '../model'
import { changesLifecycleFor } from './taskChangesLifecycle'

function observation(
  partial: Partial<TaskObservation> & Pick<TaskObservation, 'statusRead'>,
): TaskObservation {
  return {
    taskId: asTaskId('task-changes-lifecycle'),
    title: 'Lifecycle fixture',
    headerMeta: 'Claude · Opus 5.5 · HarflowWeb',
    transcript: transcriptObservationFor('observed'),
    detailsPane: 'changes',
    ...partial,
  }
}

const available: TaskChangesCapture = { state: 'available', reason: null }
const pending: TaskChangesCapture = {
  state: 'pending',
  reason: 'capture_settling',
}

describe('changesLifecycleFor', () => {
  it('maps unread status to unavailable', () => {
    expect(
      changesLifecycleFor(
        observation({ statusRead: { kind: 'unread' } }),
        available,
      ),
    ).toBe('unavailable')
  })

  it('maps pending status to notStarted', () => {
    expect(
      changesLifecycleFor(
        observation({ statusRead: { kind: 'observed', status: 'pending' } }),
        null,
      ),
    ).toBe('notStarted')
  })

  it('maps a live run to running even when a capture document exists', () => {
    expect(
      changesLifecycleFor(
        observation({ statusRead: { kind: 'observed', status: 'running' } }),
        pending,
      ),
    ).toBe('running')
  })

  it('maps an inferred outcome to notObserved', () => {
    expect(
      changesLifecycleFor(
        observation({
          statusRead: { kind: 'observed', status: 'completed' },
          exitObserved: false,
        }),
        available,
      ),
    ).toBe('notObserved')
  })

  it('maps settling observation to settling', () => {
    expect(
      changesLifecycleFor(
        observation({
          statusRead: { kind: 'observed', status: 'completed' },
          exitObserved: true,
          settling: true,
        }),
        available,
      ),
    ).toBe('settling')
  })

  it('maps a pending capture on a settled task to settling', () => {
    expect(
      changesLifecycleFor(
        observation({
          statusRead: { kind: 'observed', status: 'completed' },
          exitObserved: true,
        }),
        pending,
      ),
    ).toBe('settling')
  })

  it('maps a stored capture on a settled task to capture', () => {
    expect(
      changesLifecycleFor(
        observation({
          statusRead: { kind: 'observed', status: 'completed' },
          exitObserved: true,
        }),
        available,
      ),
    ).toBe('capture')
  })

  it('maps a settled task with no capture yet to capture', () => {
    expect(
      changesLifecycleFor(
        observation({
          statusRead: { kind: 'observed', status: 'completed' },
          exitObserved: true,
        }),
        null,
      ),
    ).toBe('capture')
  })
})
