import { describe, expect, it } from 'vitest'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { asTaskId, type TaskObservation } from '../model'
import { TASK_NOTICES } from './taskStatusCopy'
import { taskStatusView } from './taskStatusView'

function baseObservation(
  partial: Partial<TaskObservation> & Pick<TaskObservation, 'statusRead'>,
): TaskObservation {
  return {
    taskId: asTaskId('task-test'),
    title: 'Test task',
    headerMeta: 'Claude · Opus 5.5 · HarflowMCP',
    transcript: transcriptObservationFor('observed'),
    detailsPane: null,
    ...partial,
  }
}

describe('taskStatusView', () => {
  it('maps running with Stop in the composer', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
        elapsedSeconds: 252,
      }),
    )
    expect(view.badge.label).toBe('Running 04:12')
    expect(view.composer.stopMode).toBe('stop')
    expect(view.composer.placeholder).toBe('Queue a message…')
    expect(view.composer.showSendNow).toBe(false)
  })

  const RUNNING = { kind: 'observed', status: 'running' } as const
  const SUPPORTED = { kind: 'ready', supported: true } as const
  const UNSUPPORTED = { kind: 'ready', supported: false } as const

  it('shows Send now when the engine offers messaging.v1 and status carries the ledger', () => {
    const view = taskStatusView(
      baseObservation({ statusRead: RUNNING, messages: [] }),
      null,
      SUPPORTED,
    )
    expect(view.composer.showSendNow).toBe(true)
    expect(view.composer.locked).toBe(false)
  })

  it('keeps the prior shell while the capability is unobserved or the status has no ledger', () => {
    const loading = taskStatusView(
      baseObservation({ statusRead: RUNNING, messages: [] }),
      null,
      { kind: 'loading' },
    )
    expect(loading.composer.showSendNow).toBe(false)
    expect(loading.composer.locked).toBe(false)
    const noLedger = taskStatusView(
      baseObservation({ statusRead: RUNNING }),
      null,
      SUPPORTED,
    )
    expect(noLedger.composer.showSendNow).toBe(false)
    expect(noLedger.composer.locked).toBe(false)
  })

  it('locks the composer without Send now when the engine lacks messaging.v1', () => {
    const view = taskStatusView(
      baseObservation({ statusRead: RUNNING, messages: [] }),
      null,
      UNSUPPORTED,
    )
    expect(view.composer.showSendNow).toBe(false)
    expect(view.composer.locked).toBe(true)
    expect(view.composer.placeholder).toBe('')
    expect(view.composer.hint).toBe('')
  })

  it('maps stop-requested chrome to stopping notice and composer', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
        elapsedSeconds: 252,
      }),
      'stop-requested',
    )
    expect(view.notice?.title).toBe('Stop requested')
    expect(view.composer.stopMode).toBe('stopping')
    expect(view.badge.label).toBe('Running 04:12')
  })

  it('maps cancelled badge to Cancelled', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'cancelled' },
        elapsedSeconds: 271,
      }),
    )
    expect(view.badge.label).toBe('Cancelled 04:31')
    expect(view.banner?.title).toBe('Cancelled')
  })

  it('does not treat status unavailable as an engine status value', () => {
    const view = taskStatusView(
      baseObservation({ statusRead: { kind: 'unread' } }),
    )
    expect(view.badge.label).toBe('Status unavailable')
    expect(view.notice?.title).toBe('Current status unavailable')
    expect(view.composer.locked).toBe(true)
  })

  it('maps continue-started notice to New session accepted', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
      }),
      'continue-started',
    )
    expect(view.notice?.title).toBe('New session accepted')
    expect(view.notice?.body).toBe(TASK_NOTICES.continued.body)
  })

  it('maps launch-unknown to Check for a new task', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
      }),
      'continue-unknown',
    )
    expect(view.banner?.title).toBe('A new session may have started')
    expect(view.banner?.actions[0]?.label).toBe('Check for a new task')
    expect(view.composer.locked).toBe(true)
    expect(view.composer.placeholder).toBe(
      'Locked until the new session is checked',
    )
  })

  it('keeps reported status on the badge when settling', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'completed' },
        elapsedSeconds: 1264,
        settling: true,
        exitObserved: true,
      }),
    )
    expect(view.badge.label).toBe('Done 21:04')
    expect(view.notice?.title).toBe('Settling')
  })

  it('maps timed_out', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'timed_out' },
        elapsedSeconds: 760,
      }),
    )
    expect(view.badge.label).toBe('Timed out 12:40')
    expect(view.banner?.title).toBe('This run stopped at its turn limit')
  })

  it('maps unknown failed inference', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        exitObserved: false,
      }),
    )
    expect(view.badge.label).toBe('Failed · exit not observed')
    expect(view.banner?.title).toBe('Outcome inferred, not observed')
  })

  it('maps unknown done inference', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'completed' },
        exitObserved: false,
      }),
    )
    expect(view.badge.label).toBe('Done · exit not observed')
    expect(view.notice?.title).toBe('Reconstructed outcome')
  })

  it('maps owner lost supervision', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
        supervision: 'owner_lost',
      }),
    )
    expect(view.badge.label).toBe('Running · owner lost')
    expect(view.banner?.title).toBe('The process watching this run is gone')
    expect(view.composer.stopMode).toBe('stop')
  })

  it('maps unverified supervision', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
        supervision: 'unverified',
      }),
    )
    expect(view.badge.label).toBe('Running · not verified')
    expect(view.banner?.title).toBe("Harflow can't confirm this run")
  })

  it('maps pending', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'pending' },
      }),
    )
    expect(view.badge.label).toBe('Pending')
    expect(view.composer.locked).toBe(true)
    expect(view.composer.stopMode).toBe('stop')
  })

  it('maps taken over', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'taken_over' },
        elapsedSeconds: 271,
      }),
    )
    expect(view.badge.label).toBe('Cancelled 04:31 · taken over')
    expect(view.composer.locked).toBe(true)
  })

  it('maps continue-starting chrome', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        elapsedSeconds: 468,
        failure: {
          title: 'Task failed: the harness exited with code 1',
          intro: 'The last error was:',
          lastError: 'error',
        },
      }),
      'continue-starting',
    )
    expect(view.composer.placeholder).toBe('Starting a new session…')
    expect(view.banner?.actions[0]?.label).toBe('Starting…')
  })

  it('maps observed failed with failure banner', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        elapsedSeconds: 468,
        exitObserved: true,
        failure: {
          title: 'Task failed: the harness exited with code 1',
          intro: 'The last error was:',
          lastError: 'json.decoder.JSONDecodeError',
        },
      }),
    )
    expect(view.badge.label).toBe('Failed 07:48')
    expect(view.banner?.title).toBe(
      'Task failed: the harness exited with code 1',
    )
    expect(view.banner?.actions[0]?.label).toBe('Continue in a new session')
  })

  it('applies supervision labels only while the status is running', () => {
    const failed = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        elapsedSeconds: 468,
        supervision: 'owner_lost',
      }),
    )
    expect(failed.badge.label).toBe('Failed 07:48')
    expect(failed.banner?.title).not.toBe('The process watching this run is gone')
    const unread = taskStatusView(
      baseObservation({
        statusRead: { kind: 'unread' },
        supervision: 'unverified',
      }),
    )
    expect(unread.badge.label).toBe('Status unavailable')
  })

  it('formats the badge clock from elapsed seconds', () => {
    const label = (elapsedSeconds: number) =>
      taskStatusView(
        baseObservation({
          statusRead: { kind: 'observed', status: 'running' },
          elapsedSeconds,
        }),
      ).badge.label
    expect(label(252)).toBe('Running 04:12')
    expect(label(1264)).toBe('Running 21:04')
    expect(label(3725)).toBe('Running 1:02:05')
  })

  it('appends the turn count to the meta line only for continued tasks', () => {
    const running = { kind: 'observed', status: 'running' } as const
    expect(
      taskStatusView(baseObservation({ statusRead: running })).meta,
    ).toBe('Claude · Opus 5.5 · HarflowMCP')
    expect(
      taskStatusView(baseObservation({ statusRead: running, turnCount: 1 }))
        .meta,
    ).toBe('Claude · Opus 5.5 · HarflowMCP')
    expect(
      taskStatusView(baseObservation({ statusRead: running, turnCount: 2 }))
        .meta,
    ).toBe('Claude · Opus 5.5 · HarflowMCP · 2 turns')
  })

  it('hides the meta line and maps the resource card for a waiting pending launch', () => {
    const pending = baseObservation({
      statusRead: { kind: 'observed', status: 'pending' },
      launchWait: 'resources',
    })
    const view = taskStatusView(pending)
    expect(view.meta).toBeNull()
    expect(view.body.kind).toBe('notStarted')
    expect(view.resourceCard).toEqual({
      title: 'Waiting for resources',
      detail: 'This task has no record yet and has not started.',
      note: 'The engine reports launch state only here. Slot details are on the Resources screen.',
      linkLabel: 'Open resource slots',
    })
    const bare = taskStatusView(
      baseObservation({ statusRead: { kind: 'observed', status: 'pending' } }),
    )
    expect(bare.resourceCard).toBeNull()
  })

  it('chooses the conversation body only when the observation has one', () => {
    const running = { kind: 'observed', status: 'running' } as const
    expect(
      taskStatusView(baseObservation({ statusRead: running })).body.kind,
    ).toBe('transcript')
    expect(
      taskStatusView(
        baseObservation({
          statusRead: running,
          conversation: { request: 'Do the thing.', items: [] },
        }),
      ).body.kind,
    ).toBe('conversation')
  })
})

describe('taskStatusView held resource card', () => {
  const running = { kind: 'observed', status: 'running' } as const
  const held = {
    names: ['heavy-build'],
    reservationId: 'r1',
    state: 'held',
    grantedAt: '2026-11-15T09:56:00Z',
  } as const

  function cardFor(partial: Partial<TaskObservation>) {
    return taskStatusView(baseObservation({ statusRead: running, ...partial }))
      .resourceCard
  }

  it('titles the held card with the resource name and a relative note', () => {
    const card = cardFor({ resources: held, observedAt: '2026-11-15T10:00:00Z' })
    expect(card?.title).toBe('Holding heavy-build')
    expect(card?.note).toBe('Since 4m ago')
  })

  it('has no note when grantedAt or observedAt is missing', () => {
    const { grantedAt: _omitted, ...withoutGrant } = held
    expect(
      cardFor({ resources: held })?.note,
    ).toBeNull()
    expect(
      cardFor({
        resources: withoutGrant,
        observedAt: '2026-11-15T10:00:00Z',
      })?.note,
    ).toBeNull()
  })

  it('has no note when a timestamp cannot be parsed', () => {
    expect(
      cardFor({
        resources: { ...held, grantedAt: 'not-a-date' },
        observedAt: '2026-11-15T10:00:00Z',
      })?.note,
    ).toBeNull()
    expect(
      cardFor({ resources: held, observedAt: 'garbage' })?.note,
    ).toBeNull()
  })

  it('draws no card for a released reservation', () => {
    expect(
      cardFor({
        resources: { ...held, state: 'released' },
        observedAt: '2026-11-15T10:00:00Z',
      }),
    ).toBeNull()
  })
})
