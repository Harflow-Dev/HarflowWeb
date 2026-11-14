import { describe, expect, it } from 'vitest'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { asTaskId, type TaskObservation } from '../model'
import type { TaskCommandChrome } from './taskStatusTypes'
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
    accessLevel: 'edit_repo',
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

  it('maps stopping: no Stop or Take over; terminal unavailable', () => {
    expect(mapFor('stopping')).toEqual({
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

const running = { kind: 'observed', status: 'running' } as const

function labels(view: ReturnType<typeof overflowMenuView>): string[] {
  if (!view) return []
  return [...view.primary, ...view.repository.items].map((item) => item.label)
}

describe('overflowMenuVariant', () => {
  const cases: readonly [
    string,
    Pick<TaskObservation, 'statusRead'>,
    TaskCommandChrome,
    OverflowMenuVariant,
  ][] = [
    ['running', { statusRead: running }, null, 'running'],
    [
      'running with stop requested',
      { statusRead: running },
      'stop-requested',
      'stopping',
    ],
    [
      'pending',
      { statusRead: { kind: 'observed', status: 'pending' } },
      null,
      'pending',
    ],
    [
      'completed',
      { statusRead: { kind: 'observed', status: 'completed' } },
      null,
      'settled',
    ],
    [
      'failed',
      { statusRead: { kind: 'observed', status: 'failed' } },
      null,
      'settled',
    ],
    [
      'timed_out',
      { statusRead: { kind: 'observed', status: 'timed_out' } },
      null,
      'settled',
    ],
    [
      'cancelled',
      { statusRead: { kind: 'observed', status: 'cancelled' } },
      null,
      'settled',
    ],
    [
      'taken_over',
      { statusRead: { kind: 'observed', status: 'taken_over' } },
      null,
      'settled',
    ],
    ['unread', { statusRead: { kind: 'unread' } }, null, 'unavailable'],
    [
      'failed ignores stop-requested chrome',
      { statusRead: { kind: 'observed', status: 'failed' } },
      'stop-requested',
      'settled',
    ],
  ]

  it.each(cases)('%s', (_name, extra, chrome, expected) => {
    expect(overflowMenuVariant(observation(extra), chrome)).toBe(expected)
  })
})

describe('overflowMenuView', () => {
  it('orders running items like the design overflow()', () => {
    const view = overflowMenuView(observation({ statusRead: running }), null)
    expect(view?.variant).toBe('running')
    expect(view?.primary.map((item) => item.label)).toEqual([
      'Stop task…',
      'Take over in terminal…',
      'Copy resume command',
      'Copy task ID',
    ])
    expect(view?.repository.name).toBe('HarflowMCP')
    expect(view?.repository.items.map((item) => item.label)).toEqual([
      'Open in Finder',
      'Copy path',
    ])
  })

  it('draws the stop-requested menu like the design "stopping" composer', () => {
    const view = overflowMenuView(
      observation({ statusRead: running }),
      'stop-requested',
    )
    expect(view?.variant).toBe('stopping')
    expect(labels(view)).toEqual([
      'Open in terminal…',
      'Copy resume command',
      'Copy task ID',
      'Open in Finder',
      'Copy path',
    ])
    const terminal = view?.primary.find((item) => item.id === 'openTerminal')
    expect(terminal?.availability).toBe('unavailable')
  })

  it('includes Open parent task with hint for a sub-task', () => {
    const view = overflowMenuView(
      observation({
        statusRead: running,
        parent: {
          taskId: asTaskId('task-parent'),
          title: 'Nightly dependency audit',
        },
      }),
      null,
    )
    const parent = view?.primary.find((item) => item.id === 'openParent')
    expect(parent?.hint).toBe('Started by Nightly dependency audit')
  })

  it('does not offer Take over without an observed access level', () => {
    const { accessLevel: _unused, ...rest } = observation({
      statusRead: running,
    })
    const view = overflowMenuView(rest, null)
    expect(labels(view)).not.toContain('Take over in terminal…')
    expect(labels(view)).toContain('Stop task…')
  })

  it('draws no menu when the observation omits it or has no repository', () => {
    expect(
      overflowMenuView(
        observation({ statusRead: running, overflowMenu: 'omitted' }),
        null,
      ),
    ).toBeNull()
    const { repository: _unused, ...rest } = observation({
      statusRead: running,
    })
    expect(overflowMenuView(rest, null)).toBeNull()
    expect(
      overflowMenuView(
        {
          ...observation({ statusRead: { kind: 'unread' } }),
          transcript: transcriptObservationFor('observed'),
          overflowMenu: 'omitted',
        },
        null,
      ),
    ).toBeNull()
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
