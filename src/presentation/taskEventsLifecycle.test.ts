import { describe, expect, it } from 'vitest'
import { TASK_EVENTS_NOT_STARTED_ID } from '../adapters/mock/taskEventsFixtureIds'
import {
  populatedEventsTaskObservation,
  TASK_EVENTS_BY_ID,
} from '../adapters/mock/taskEventsTaskFixtures'
import { eventsLifecycleFor } from './taskEventsLifecycle'

const loading = { kind: 'loading' as const }
const ready = {
  kind: 'ready' as const,
  observation: {
    taskId: populatedEventsTaskObservation().taskId,
    records: [],
    hasEarlier: false,
    earlierPage: [],
    logState: 'available' as const,
  },
}

describe('eventsLifecycleFor', () => {
  it('maps pending status to notStarted before any observation', () => {
    const pending = TASK_EVENTS_BY_ID.get(TASK_EVENTS_NOT_STARTED_ID)!
    expect(eventsLifecycleFor(pending, loading)).toBe('notStarted')
    expect(eventsLifecycleFor(pending, ready)).toBe('notStarted')
  })

  it('maps unread status to unavailable', () => {
    const unread = {
      ...populatedEventsTaskObservation(),
      statusRead: { kind: 'unread' as const },
    }
    expect(eventsLifecycleFor(unread, loading)).toBe('unavailable')
    expect(eventsLifecycleFor(unread, ready)).toBe('unavailable')
  })

  it('maps a settled task to loading then ready', () => {
    const observation = populatedEventsTaskObservation()
    expect(eventsLifecycleFor(observation, loading)).toBe('loading')
    expect(eventsLifecycleFor(observation, ready)).toBe('ready')
  })
})
