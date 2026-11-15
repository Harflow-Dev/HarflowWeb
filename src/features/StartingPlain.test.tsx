import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  QUEUE_PY_PATH,
  taskChangesLoadFor,
} from '../adapters/mock/taskChangesFixtures'
import {
  RETRY_BUDGET_DONE_TASK_ID,
  SLOT_RELEASE_TASK_ID,
} from '../adapters/mock/taskFixtures'
import {
  TRANSCRIPT_TASK_IDS,
  transcriptTaskObservation,
} from '../adapters/mock/transcriptFixtures'
import { createApp, PreviewShell } from '../composition'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('new-task/centered-starting-plain', () => {
  it('disables Start as Starting task, hides the status row, and announces once', async () => {
    window.location.hash = '#composer-starting'
    render(<PreviewShell />)
    const start = await screen.findByRole('button', { name: 'Starting task' })
    expect(start).toBeDisabled()
    expect(document.querySelector('.hw-compose-status')).toBeNull()
    expect(screen.queryByText('Starting task…', {
      selector: '.hw-compose-status',
    })).toBeNull()
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Starting task…')
    })
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('clears the Starting task… announcement after Resolve held start', async () => {
    const user = userEvent.setup()
    window.location.hash = '#composer-starting'
    render(<PreviewShell />)
    await screen.findByRole('button', { name: 'Starting task' })
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Starting task…')
    })
    await user.click(
      screen.getByRole('button', { name: 'Resolve held start' }),
    )
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).not.toBe('Starting task…')
    })
    expect(
      screen.getByRole('button', { name: 'Start task' }),
    ).toBeInTheDocument()
    expect(document.querySelector('.hw-compose-status')).not.toBeNull()
  })

  it('keeps focus in the prompt on Enter with an empty prompt', async () => {
    const user = userEvent.setup()
    window.location.hash = '#populated'
    render(<PreviewShell />)
    const prompt = await readyPrompt()
    await user.click(prompt)
    expect(prompt).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(prompt).toHaveFocus()
    expect(document.body).not.toHaveFocus()
  })

  it('keeps focus in the prompt on Enter while Start is blocked', async () => {
    const user = userEvent.setup()
    window.location.hash = '#composer-unqualified'
    render(<PreviewShell />)
    const prompt = await readyPrompt()
    await waitFor(() => expect(readyPromptNow()).not.toHaveValue(''))
    await user.click(readyPromptNow())
    expect(prompt).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(readyPromptNow()).toHaveFocus()
  })
})

/** The prompt of the real composer (the loading composer is disabled). */
function readyPromptNow(): HTMLElement {
  return screen.getByLabelText('Task prompt')
}

async function readyPrompt(): Promise<HTMLElement> {
  await waitFor(() => expect(readyPromptNow()).not.toBeDisabled())
  return readyPromptNow()
}

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('task pane loading skeletons via preview', () => {
  it('shows Changes loading then replaces it when the observation resolves', async () => {
    const app = createApp('task-changes-loading')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => app.presenter.openTask(RETRY_BUDGET_DONE_TASK_ID))
    await settle()
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    const busy = await screen.findByRole('group', {
      name: 'Reading stored changes',
    })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(
      within(busy).getByText('Reading stored changes', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(within(busy).queryByText(/proposal/)).toBeNull()

    const query = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    }
    await act(async () => {
      app.mock.publishTaskChanges(query, taskChangesLoadFor(query))
    })
    expect(
      screen.queryByRole('group', { name: 'Reading stored changes' }),
    ).toBeNull()
    expect(
      screen.getByRole('group', { name: `Diff of ${QUEUE_PY_PATH}` }),
    ).toBeInTheDocument()
  })

  it('does not land task A changes in task B when A resolves late', async () => {
    const app = createApp('task-changes-loading')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => app.presenter.openTask(RETRY_BUDGET_DONE_TASK_ID))
    await settle()
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await screen.findByRole('group', { name: 'Reading stored changes' })
    await act(async () => app.presenter.openTask(SLOT_RELEASE_TASK_ID))
    await settle()

    const query = {
      taskId: RETRY_BUDGET_DONE_TASK_ID,
      selectedEntry: null,
      turnTaskId: null,
    }
    await act(async () => {
      app.mock.publishTaskChanges(query, taskChangesLoadFor(query))
    })
    expect(app.presenter.getState().task.selectedTaskId).toBe(
      SLOT_RELEASE_TASK_ID,
    )
    expect(screen.queryByText(QUEUE_PY_PATH)).toBeNull()
    expect(screen.queryByText(/harflow_web\/delivery\/queue\.py/)).toBeNull()
  })

  it('shows Events loading from the transcript loading observation', async () => {
    window.location.hash = '#task-events-loading'
    render(<PreviewShell />)
    const busy = await screen.findByRole('group', { name: 'Loading Events' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    expect(within(busy).getByText('Loading tool activity')).toBeInTheDocument()
    expect(
      within(busy).getByText('Loading captured history'),
    ).toBeInTheDocument()
  })

  it('replaces the Events skeleton with content when the transcript resolves', async () => {
    const app = createApp('task-events-loading')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    const taskId = TRANSCRIPT_TASK_IDS.loading
    await act(async () => app.presenter.openTask(taskId))
    await settle()
    await act(async () => app.presenter.setTaskChangesPaneOpen(true))
    await screen.findByRole('group', { name: 'Loading Events' })

    await act(async () => {
      app.mock.publishTask(taskId, {
        kind: 'ready',
        observation: {
          ...transcriptTaskObservation('observed'),
          taskId,
        },
      })
    })
    expect(screen.queryByRole('group', { name: 'Loading Events' })).toBeNull()
    expect(screen.getByText('2 tool calls observed')).toBeInTheDocument()
  })
})
