import { describe, expect, it } from 'vitest'
import { taskLoadFor } from '../adapters/mock/taskFixtures'
import type { TaskObservation } from '../model'
import {
  taskTopbarChips,
  topbarOmitsMetaForPane,
} from './taskTopbarChips'

function ready(taskId: string): TaskObservation {
  const load = taskLoadFor(taskId)
  if (load.kind !== 'ready') throw new Error('expected ready')
  return load.observation
}

describe('taskTopbarChips', () => {
  it('builds access, notices and continuity chips from observed facts', () => {
    const base = ready('task-slot-release')
    const observation: TaskObservation = {
      ...base,
      notices: [
        'Checkout is on the default branch.',
        'Inherited settings could not all be read.',
      ],
      continuity: { adoptedAfterRestart: true, at: null },
      turnCount: 3,
    }
    const chips = taskTopbarChips(observation)
    expect(chips.map((c) => c.id)).toEqual([
      'continuity',
      'notices',
      'enforcement',
    ])
    expect(chips[1]?.label).toBe('2 notices')
    expect(chips[1]?.narrowLabel).toBe('2')
    expect(chips[2]?.label).toBe('Can edit this repo')
  })

  it('omits the access chip while pending', () => {
    const chips = taskTopbarChips(ready('task-m05-pending'))
    expect(chips.some((c) => c.id === 'enforcement')).toBe(false)
  })
})

describe('topbarOmitsMetaForPane', () => {
  it('drops meta when the pane is open with notices or continuity', () => {
    const withNotices: TaskObservation = {
      ...ready('task-slot-release'),
      notices: ['Checkout is on the default branch.'],
    }
    expect(topbarOmitsMetaForPane(withNotices, true)).toBe(true)
    expect(topbarOmitsMetaForPane(withNotices, false)).toBe(false)
  })
})
