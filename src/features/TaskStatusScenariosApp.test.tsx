import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { scenarioById } from '../adapters/mock'
import { TASK_STATUS_CONTINUE_STARTED_ID } from '../adapters/mock/taskStatusFixtures'
import { applyNewTaskSeed, createApp } from '../composition'
import { TASK_NOTICES } from '../presentation/taskStatusCopy'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function mount(scenario: 'task-stop-requested' | 'task-continue-started') {
  const app = createApp(scenario)
  render(<AppFeature presenter={app.presenter} />)
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  await act(async () => {
    applyNewTaskSeed(app.presenter, scenarioById(scenario).seed)
    await Promise.resolve()
    await Promise.resolve()
  })
  return app
}

describe('Task status preview scenarios', () => {
  it('boots task-stop-requested with stop-requested chrome after seeding', async () => {
    const app = await mount('task-stop-requested')
    await waitFor(() => {
      expect(screen.getByText(TASK_NOTICES.stopping.title)).toBeInTheDocument()
    })
    expect(app.presenter.getState().task.commandChrome).toBe('stop-requested')
    expect(screen.getByText('Stopping…')).toBeInTheDocument()
  })

  it('seeds continue-started chrome after the task observation is ready', async () => {
    const app = await mount('task-continue-started')
    await waitFor(() => {
      expect(app.presenter.getState().task.selectedTaskId).toBe(
        TASK_STATUS_CONTINUE_STARTED_ID,
      )
    })
    expect(app.presenter.getState().task.commandChrome).toBe('continue-started')
    expect(screen.getByText(TASK_NOTICES.continued.title)).toBeInTheDocument()
  })

  it('clears stop-requested chrome when createApp remounts without seeded chrome', async () => {
    const seeded = await mount('task-stop-requested')
    expect(seeded.presenter.getState().task.commandChrome).toBe('stop-requested')
    cleanup()
    const fresh = createApp('task-running-stop')
    render(<AppFeature presenter={fresh.presenter} />)
    await act(async () => {
      applyNewTaskSeed(fresh.presenter, scenarioById('task-running-stop').seed)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(fresh.presenter.getState().task.commandChrome).toBe(null)
  })
})