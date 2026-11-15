import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, PreviewShell } from '../composition'
import { AppFeature } from './AppFeature'
import {
  EVENTS_BEGINNING,
  EVENTS_HISTORY_UNAVAILABLE,
  EVENTS_PAGE_ERROR,
  EVENTS_UNAVAILABLE,
} from '../presentation/taskEventsCopy'
import {
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from '../adapters/mock/taskEventsFixtureIds'
import { pageEventsObservation } from '../adapters/mock/taskEventsFixtures'
import { populatedEventsTaskObservation } from '../adapters/mock/taskEventsTaskFixtures'
import type { TaskEventsLoad } from '../model'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('Events tab switching and paging', () => {
  it('switches Changes ↔ Events without dropping the Changes list', async () => {
    const user = userEvent.setup()
    window.location.hash = '#task-events-populated'
    render(<PreviewShell />)
    const pane = await screen.findByRole('complementary', { name: 'Task details' })
    expect(within(pane).getByText('2 tool calls observed')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Changes/ }))
    expect(screen.getByRole('tab', { name: /Changes/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(screen.getByRole('tab', { name: 'Events' }))
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(pane).getByText('2 tool calls observed')).toBeInTheDocument()
  })

  it('loads earlier records from the fixture and keeps reading position copy', async () => {
    const user = userEvent.setup()
    window.location.hash = '#task-events-page'
    render(<PreviewShell />)
    const pane = await screen.findByRole('complementary', { name: 'Task details' })
    expect(within(pane).getByRole('button', { name: 'Load earlier' })).toBeInTheDocument()
    expect(within(pane).queryByText(/"seq": 40/)).toBeNull()
    await user.click(within(pane).getByRole('button', { name: 'Load earlier' }))
    expect(within(pane).getByText(EVENTS_BEGINNING)).toBeInTheDocument()
    expect(within(pane).getByText(/"seq": 40/)).toBeInTheDocument()
    expect(within(pane).getByText(/"seq": 41/)).toBeInTheDocument()
  })

  it('unavailable Events commands report through StatusRegion', async () => {
    const user = userEvent.setup()
    window.location.hash = '#task-events-error'
    render(<PreviewShell />)
    const pane = await screen.findByRole('complementary', { name: 'Task details' })
    await user.click(
      within(pane).getByRole('button', { name: EVENTS_HISTORY_UNAVAILABLE.action }),
    )
    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      `${EVENTS_HISTORY_UNAVAILABLE.action} is unavailable in this exploratory slice.`,
    )
  })

  it('page-error Reload from newest is an unavailable command', async () => {
    const user = userEvent.setup()
    window.location.hash = '#task-events-page-error'
    render(<PreviewShell />)
    const pane = await screen.findByRole('complementary', { name: 'Task details' })
    await user.click(
      within(pane).getByRole('button', { name: EVENTS_PAGE_ERROR.action }),
    )
    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      `${EVENTS_PAGE_ERROR.action} is unavailable in this exploratory slice.`,
    )
  })
})

describe('Events observation fencing', () => {
  /** Records every events callback so a stale delivery can be replayed. */
  function captureEventsCallbacks(
    app: ReturnType<typeof createApp>,
  ): ((load: TaskEventsLoad) => void)[] {
    const callbacks: ((load: TaskEventsLoad) => void)[] = []
    const original = app.mock.engine.observeTaskEvents.bind(app.mock.engine)
    app.mock.engine.observeTaskEvents = (query, onUpdate) => {
      callbacks.push(onUpdate)
      return original(query, onUpdate)
    }
    return callbacks
  }

  it('drops a late events read after the pane is closed or the task changes', async () => {
    const app = createApp('task-events-page')
    const callbacks = captureEventsCallbacks(app)
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    const other = TASK_EVENTS_POPULATED_ID
    await act(async () => {
      app.presenter.openTask(TASK_EVENTS_PAGE_ID)
    })
    await settle()
    await act(async () => app.presenter.setTaskPaneTab('events'))
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await settle()
    const stale = callbacks.at(-1)
    expect(stale).toBeDefined()

    await act(async () => app.presenter.setTaskChangesPaneOpen(false))
    await act(async () => {
      stale!({ kind: 'ready', observation: pageEventsObservation() })
    })
    expect(app.presenter.getState().task.changesPaneOpen).toBe(false)
    expect(app.presenter.getState().task.eventsList).toBeNull()

    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await settle()
    await act(async () => app.presenter.openTask(other))
    await act(async () => {
      stale!({ kind: 'ready', observation: pageEventsObservation() })
    })
    expect(app.presenter.getState().task.selectedTaskId).toBe(other)
    // The other task may open its own default pane; it never shows the stale read.
    expect(app.presenter.getState().task.eventsList).toBeNull()
  })

  it('drops a late events read when the pane re-opens on Events for the new task', async () => {
    const app = createApp('task-events-page')
    const callbacks = captureEventsCallbacks(app)
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    const other = TASK_EVENTS_POPULATED_ID
    await act(async () => app.presenter.openTask(TASK_EVENTS_PAGE_ID))
    await settle()
    await act(async () => app.presenter.setTaskPaneTab('events'))
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await settle()
    const stale = callbacks.at(-1)!
    await act(async () => app.presenter.openTask(other))
    await settle()
    await act(async () => app.presenter.setTaskPaneTab('events'))
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await settle()
    expect(app.presenter.getState().task.eventsList?.taskId).toBe(other)
    await act(async () => {
      stale({ kind: 'ready', observation: pageEventsObservation() })
    })
    expect(app.presenter.getState().task.selectedTaskId).toBe(other)
    expect(app.presenter.getState().task.eventsList?.taskId).toBe(other)
  })

  it('unread status draws Status and history unavailable', async () => {
    const app = createApp('task-events-populated')
    const observation = {
      ...populatedEventsTaskObservation(),
      statusRead: { kind: 'unread' as const },
    }
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => app.presenter.openTask(observation.taskId))
    await settle()
    await act(async () => app.presenter.setTaskPaneTab('events'))
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await settle()
    await act(async () => {
      app.mock.publishTask(observation.taskId, {
        kind: 'ready',
        observation,
      })
    })
    expect(screen.getByText(EVENTS_UNAVAILABLE.title)).toBeInTheDocument()
    expect(screen.getByText(EVENTS_UNAVAILABLE.body)).toBeInTheDocument()
  })
})
