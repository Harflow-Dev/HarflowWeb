import { describe, expect, it } from 'vitest'
import { populatedEventsTaskObservation } from '../adapters/mock/taskEventsTaskFixtures'
import {
  enforcementPairs,
  eventsFactsGroups,
  exitFactValue,
  harnessFromMeta,
  taskFactPairs,
  turnsFactValue,
} from './taskEventsFacts'
import {
  EVENTS_CONTINUITY_TEXT,
  EVENTS_EXIT_DASH,
  EVENTS_EXIT_NOT_OBSERVED,
  EVENTS_NO_NOTICES,
} from './taskEventsCopy'

describe('events factsGroups presentation', () => {
  it('maps Task, enforcement, notices count, and omits Continuity by default', () => {
    const observation = populatedEventsTaskObservation()
    const groups = eventsFactsGroups(observation)
    expect(groups.map((g) => g.id)).toEqual(['task', 'enforcement', 'notices'])
    const task = taskFactPairs(observation)
    expect(task).toEqual([
      { term: 'Status', value: 'Done 21:04' },
      { term: 'Exit', value: EVENTS_EXIT_DASH },
      { term: 'Harness', value: 'Claude · Opus 5.5' },
      { term: 'Repository', value: 'HarflowWeb' },
      { term: 'Turns', value: '3' },
      { term: 'Task ID', value: observation.publicTaskId ?? observation.taskId },
    ])
    expect(harnessFromMeta(observation.headerMeta)).toBe('Claude · Opus 5.5')
    expect(turnsFactValue(observation)).toBe('3')
    const notices = groups.find((g) => g.id === 'notices')
    expect(notices?.id).toBe('notices')
    if (notices?.id !== 'notices') throw new Error('expected notices')
    expect(notices.count).toBe('2')
    expect(notices.items).toEqual([
      'Checkout is on the default branch.',
      'Inherited settings could not all be read.',
    ])
  })

  it('maps enforcement contract names to the design copy', () => {
    const observation = populatedEventsTaskObservation()
    expect(observation.enforcement).toBeDefined()
    expect(enforcementPairs(observation.enforcement!)).toEqual([
      { term: 'Requested', value: 'Can edit this repo' },
      { term: 'Mechanism', value: 'Harness permission rules' },
      { term: 'OS sandbox', value: 'No' },
      { term: 'Writes confined', value: 'No' },
      { term: 'Direct commit commands', value: 'Denied' },
      { term: 'Publish attempts', value: 'Not allowed' },
      { term: 'Network', value: 'Not controlled' },
    ])
  })

  it('uses Not observed when exitObserved is false and 1 turn when omitted', () => {
    const populated = populatedEventsTaskObservation()
    const { turnCount: _turns, notices: _notices, ...rest } = populated
    const observation = {
      ...rest,
      exitObserved: false,
      continuity: { adoptedAfterRestart: true as const },
    }
    expect(exitFactValue(observation)).toBe(EVENTS_EXIT_NOT_OBSERVED)
    expect(turnsFactValue(observation)).toBe('1')
    const groups = eventsFactsGroups(observation)
    expect(groups.map((g) => g.id)).toEqual([
      'task',
      'enforcement',
      'notices',
      'continuity',
    ])
    const notices = groups.find((g) => g.id === 'notices')
    expect(notices?.id).toBe('notices')
    if (notices?.id !== 'notices') throw new Error('expected notices')
    expect(notices.count).toBeNull()
    expect(notices.emptyCaption).toBe(EVENTS_NO_NOTICES)
    const continuity = groups.find((g) => g.id === 'continuity')
    expect(continuity?.id).toBe('continuity')
    if (continuity?.id !== 'continuity') throw new Error('expected continuity')
    expect(continuity.paragraphs[0]).toBe(EVENTS_CONTINUITY_TEXT)
  })
})
