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
        elapsedLabel: '04:12',
      }),
    )
    expect(view.badge.label).toBe('Running 04:12')
    expect(view.composer.stopMode).toBe('stop')
    expect(view.composer.placeholder).toBe('Queue a message…')
  })

  it('maps stop-requested chrome to stopping notice and composer', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'running' },
        elapsedLabel: '04:12',
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
        elapsedLabel: '04:31',
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
        continuationOutcome: 'unknown',
      }),
    )
    expect(view.banner?.title).toBe('A new session may have started')
    expect(view.banner?.actions[0]?.label).toBe('Check for a new task')
  })

  it('keeps reported status on the badge when settling', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'completed' },
        elapsedLabel: '21:04',
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
        elapsedLabel: '12:40',
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
        elapsedLabel: '04:31',
      }),
    )
    expect(view.badge.label).toBe('Cancelled 04:31 · taken over')
    expect(view.composer.locked).toBe(true)
  })

  it('maps continue-starting chrome', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        elapsedLabel: '07:48',
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

  it('maps continue refused on cancelled', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'cancelled' },
        continueRefusedReason:
          'Continuation chain was cancelled; start a new task explicitly',
      }),
    )
    expect(view.badge.label.match(/^Cancelled/) ).toBeTruthy()
    expect(view.banner?.title).toBe('Continue was refused')
  })

  it('maps observed failed with failure banner', () => {
    const view = taskStatusView(
      baseObservation({
        statusRead: { kind: 'observed', status: 'failed' },
        elapsedLabel: '07:48',
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
})