import { describe, expect, it } from 'vitest'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { asTaskId, type TaskObservation } from '../model'
import {
  overflowItemAvailability,
  overflowMenuVariant,
  overflowMenuView,
  wontBeStoppedTitles,
  type OverflowItemId,
  type OverflowMenuVariant,
} from './taskOverflowMenu'

function observation(
  extra: Partial<TaskObservation> &
    Pick<TaskObservation, 'statusRead'>,
): TaskObservation {
  return {
    taskId: asTaskId('task-overflow-test'),
    title: 'Fix flaky slot release test',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    transcript: transcriptObservationFor('observed'),
    detailsPane: null,
    repository: { name: 'HarflowMCP', path: '~/Code/Harflow/HarflowMCP' },
    accessLabel: 'Can edit this repo',
    ...extra,
  }
}

const ALL_IDS: readonly OverflowItemId[] = [
  'stop',
  'takeover',
  'openTerminal',
  'openParent',
  'copyResume',
  'copyTaskId',
  'openFinder',
  'copyPath',
]

function mapFor(variant: OverflowMenuVariant): Record<
  OverflowItemId,
  ReturnType<typeof overflowItemAvailability>
> {
  return Object.fromEntries(
    ALL_IDS.map((id) => [id, overflowItemAvailability(variant, id)]),
  ) as Record<OverflowItemId, ReturnType<typeof overflowItemAvailability>>
}

describe('overflowItemAvailability', () => {
  it('maps running: Stop and Take over as actions; resume/finder unavailable', () => {
    expect(mapFor('running')).toEqual({
      stop: 'action',
      takeover: 'action',
      openTerminal: 'hidden',
      openParent: 'action',
      copyResume: 'unavailable',
      copyTaskId: 'action',
      openFinder: 'unavailable',
      copyPath: 'action',
    })
  })

  it('maps pending: Stop only; no terminal or resume', () => {
    expect(mapFor('pending')).toEqual({
      stop: 'action',
      takeover: 'hidden',
      openTerminal: 'hidden',
      openParent: 'action',
      copyResume: 'hidden',
      copyTaskId: 'action',
      openFinder: 'unavailable',
      copyPath: 'action',
    })
  })

  it('maps settled: Open in terminal unavailable; no Stop or Take over', () => {
    expect(mapFor('settled')).toEqual({
      stop: 'hidden',
      takeover: 'hidden',
      openTerminal: 'unavailable',
      openParent: 'action',
      copyResume: 'unavailable',
      copyTaskId: 'action',
      openFinder: 'unavailable',
      copyPath: 'action',
    })
  })

  it('maps unavailable: no Stop, terminal, or resume', () => {
    expect(mapFor('unavailable')).toEqual({
      stop: 'hidden',
      takeover: 'hidden',
      openTerminal: 'hidden',
      openParent: 'action',
      copyResume: 'hidden',
      copyTaskId: 'action',
      openFinder: 'unavailable',
      copyPath: 'action',
    })
  })
})

describe('overflowMenuView', () => {
  it('orders running items like the design overflow()', () => {
    const view = overflowMenuView(
      observation({ statusRead: { kind: 'observed', status: 'running' } }),
    )
    expect(view.variant).toBe('running')
    expect(view.items.map((item) => item.label)).toEqual([
      'Stop task…',
      'Take over in terminal…',
      'Copy resume command',
      'Copy task ID',
      'Open in Finder',
      'Copy path',
    ])
    expect(view.repositoryName).toBe('HarflowMCP')
  })

  it('includes Open parent task with hint for a sub-task', () => {
    const view = overflowMenuView(
      observation({
        statusRead: { kind: 'observed', status: 'running' },
        parent: {
          taskId: asTaskId('task-parent'),
          title: 'Nightly dependency audit',
        },
      }),
    )
    const parent = view.items.find((item) => item.id === 'openParent')
    expect(parent?.hint).toBe('Started by Nightly dependency audit')
    expect(overflowMenuVariant(observation({ statusRead: { kind: 'unread' } }))).toBe(
      'unavailable',
    )
  })

  it('derives wont-be-stopped titles from the earlier-turn read', () => {
    expect(
      wontBeStoppedTitles(
        observation({
          statusRead: { kind: 'observed', status: 'running' },
          earlierTurnRunningTasks: [
            { taskId: asTaskId('task-a'), title: 'Rebuild the index' },
          ],
        }),
      ),
    ).toEqual(['Rebuild the index'])
    expect(
      wontBeStoppedTitles(
        observation({ statusRead: { kind: 'observed', status: 'running' } }),
      ),
    ).toEqual([])
  })
})
