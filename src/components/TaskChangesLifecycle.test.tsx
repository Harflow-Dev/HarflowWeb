import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { taskStatusObservations } from '../adapters/mock/taskStatusFixtures'
import type { TaskObservation } from '../model'
import { TaskChangesPane, type TaskChangesPaneProps } from './TaskChangesPane'

afterEach(() => {
  cleanup()
})

const NOT_STARTED = 'Available once this task starts'
const RUNNING = 'No changes to show while this runs'
const UNAVAILABLE = 'Changes unavailable'
const NOT_OBSERVED = 'Changes not captured'
const SETTLING = "Stored changes aren't available yet"
const READING = 'Reading stored changes'

/** Expected pane body for every approved task-status fixture, by task id. */
const EXPECTED: Readonly<Record<string, string>> = {
  'task-slot-release': RUNNING,
  'task-m05-stop-requested': RUNNING,
  'task-m05-owner-lost': RUNNING,
  'task-m05-unverified': RUNNING,
  'task-m05-continue-started': RUNNING,
  'task-m05-pending': NOT_STARTED,
  'task-m05-status-unavailable': UNAVAILABLE,
  'task-m05-unknown-done': NOT_OBSERVED,
  'task-m05-unknown-failed': NOT_OBSERVED,
  'task-m05-settling': SETTLING,
  // Terminal statuses with an observed (or unreported) exit read the stored
  // capture, which is still loading here.
  'task-m05-cancelled': READING,
  'task-m05-timed-out': READING,
  'task-m05-taken-over': READING,
  'task-m05-launch-unknown': READING,
  'task-m05-continue-starting': READING,
  'task-events-reader-failed': READING,
}

function paneProps(taskObservation: TaskObservation): TaskChangesPaneProps {
  return {
    load: { kind: 'loading' },
    list: null,
    taskObservation,
    selectedEntry: null,
    expandedRepos: [],
    turns: null,
    textPanels: null,
    onSelectEntry: () => undefined,
    onSelectTurn: () => undefined,
    onToggleRepo: () => undefined,
    onClosePane: () => undefined,
    onUnavailable: () => undefined,
    onSelectTab: () => undefined,
    onLoadEarlier: () => undefined,
  }
}

describe('Changes pane lifecycle across task-status fixtures', () => {
  const observations = taskStatusObservations()

  it('has an expectation for every task-status fixture and no extras', () => {
    expect(observations.map((o) => o.taskId).sort()).toEqual(
      Object.keys(EXPECTED).sort(),
    )
  })

  it.each(observations.map((o) => [o.taskId, o] as const))(
    'draws the lifecycle body for %s with the pane open',
    (taskId, observation) => {
      render(<TaskChangesPane {...paneProps(observation)} />)
      expect(
        screen.getByRole('complementary', { name: 'Task details' }),
      ).toHaveTextContent(EXPECTED[taskId]!)
      // No stored-capture count is claimed outside the capture lifecycle.
      expect(screen.getByRole('tab', { name: 'Changes' })).toBeInTheDocument()
    },
  )
})
