import {
  act,
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import { TASK_STATUS_SCENARIOS } from '../adapters/mock/scenarioCatalogTaskStatuses'
import { taskLoadFor } from '../adapters/mock/taskFixtures'
import { TASK_STATUS_STOP_REQUESTED_ID } from '../adapters/mock/taskStatusFixtures'
import {
  TASK_CHECK_NEW_TASK_UNAVAILABLE_EXPLANATION,
  TASK_CHECK_NEW_TASK_UNAVAILABLE_ID,
  TASK_CONTINUE_UNAVAILABLE_EXPLANATION,
  TASK_CONTINUE_UNAVAILABLE_ID,
  TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION,
  TASK_COPY_RESUME_UNAVAILABLE_ID,
  TASK_REFRESH_UNAVAILABLE_EXPLANATION,
  TASK_REFRESH_UNAVAILABLE_ID,
  TASK_RETRY_READ_UNAVAILABLE_EXPLANATION,
  TASK_RETRY_READ_UNAVAILABLE_ID,
  TASK_STOP_UNAVAILABLE_EXPLANATION,
  TASK_STOP_UNAVAILABLE_ID,
} from '../components/taskUnavailable'
import { applyNewTaskSeed, createApp, PreviewShell } from '../composition'
import { taskStatusView } from '../presentation'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function mount(scenario: ScenarioId) {
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

function expectUniqueElementIds() {
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
}

type ScenarioCopy = {
  readonly scenario: ScenarioId
  readonly badge: string
  readonly noticeTitle: string | null
  readonly bannerTitle: string | null
}

const SCENARIO_COPY: readonly ScenarioCopy[] = [
  {
    scenario: 'task-stop-requested',
    badge: 'Running 04:12',
    noticeTitle: 'Stop requested',
    bannerTitle: null,
  },
  {
    scenario: 'task-cancelled',
    badge: 'Cancelled 04:31',
    noticeTitle: null,
    bannerTitle: 'Cancelled',
  },
  {
    scenario: 'task-timed-out',
    badge: 'Timed out 12:40',
    noticeTitle: null,
    bannerTitle: 'This run stopped at its turn limit',
  },
  {
    scenario: 'task-settling',
    badge: 'Done 21:04',
    noticeTitle: 'Settling',
    bannerTitle: null,
  },
  {
    scenario: 'task-unknown-failed',
    badge: 'Failed · exit not observed',
    noticeTitle: null,
    bannerTitle: 'Outcome inferred, not observed',
  },
  {
    scenario: 'task-unknown-done',
    badge: 'Done · exit not observed',
    noticeTitle: 'Reconstructed outcome',
    bannerTitle: null,
  },
  {
    scenario: 'task-owner-lost',
    badge: 'Running · owner lost',
    noticeTitle: null,
    bannerTitle: 'The process watching this run is gone',
  },
  {
    scenario: 'task-unverified',
    badge: 'Running · not verified',
    noticeTitle: null,
    bannerTitle: "Harflow can't confirm this run",
  },
  {
    scenario: 'task-launch-unknown',
    badge: 'Failed 07:48',
    noticeTitle: null,
    bannerTitle: 'A new session may have started',
  },
  {
    scenario: 'task-status-unavailable',
    badge: 'Status unavailable',
    noticeTitle: 'Current status unavailable',
    bannerTitle: null,
  },
  {
    scenario: 'task-pending',
    badge: 'Pending',
    noticeTitle: null,
    bannerTitle: null,
  },
  {
    scenario: 'task-taken-over',
    badge: 'Cancelled 04:31 · taken over',
    noticeTitle: null,
    bannerTitle: null,
  },
  {
    scenario: 'task-continue-starting',
    badge: 'Failed 07:48',
    noticeTitle: null,
    bannerTitle: 'Task failed: the harness exited with code 1',
  },
  {
    scenario: 'task-continue-started',
    badge: 'Running 04:12',
    noticeTitle: 'New session accepted',
    bannerTitle: null,
  },
  {
    scenario: 'task-running-stop',
    badge: 'Running 04:12',
    noticeTitle: null,
    bannerTitle: null,
  },
  {
    scenario: 'task-failed-continue',
    badge: 'Failed 07:48',
    noticeTitle: null,
    bannerTitle: 'Task failed: the harness exited with code 1',
  },
] as const

describe('M05 task status screen copy', () => {
  it('maps each preview scenario fixture to the approved badge, notice, and banner titles', () => {
    expect(TASK_STATUS_SCENARIOS).toHaveLength(16)
    for (const row of SCENARIO_COPY) {
      const seed = scenarioById(row.scenario).seed
      expect(seed?.openTaskId).toBeTruthy()
      const load = taskLoadFor(seed!.openTaskId!)
      expect(load.kind).toBe('ready')
      if (load.kind !== 'ready') continue
      const chrome = seed?.taskCommandChrome ?? null
      const view = taskStatusView(load.observation, chrome)
      expect(view.badge.label).toBe(row.badge)
      expect(view.notice?.title ?? null).toBe(row.noticeTitle)
      expect(view.banner?.title ?? null).toBe(row.bannerTitle)
    }
  })

  it.each(SCENARIO_COPY)(
    'renders $scenario with the approved status chrome copy',
    async (row) => {
      await mount(row.scenario)
      const main = screen.getByRole('main')
      expect(within(main).getByText(row.badge)).toBeInTheDocument()
      if (row.noticeTitle) {
        expect(within(main).getByText(row.noticeTitle)).toBeInTheDocument()
      }
      if (row.bannerTitle) {
        expect(within(main).getByText(row.bannerTitle)).toBeInTheDocument()
      }
    },
  )
})

describe('M05 pending empty body', () => {
  it('renders Design pending head and empty activity copy', async () => {
    await mount('task-pending')
    const main = screen.getByRole('main')
    expect(
      within(main).getByText(
        'Original request is readable once this task starts.',
      ),
    ).toBeInTheDocument()
    expect(
      within(main).getByText('No activity yet. This task has not started.'),
    ).toBeInTheDocument()
    expect(
      within(main).getByPlaceholderText(
        'Messages are available once this task starts',
      ),
    ).toBeDisabled()
    expect(within(main).getByRole('button', { name: 'Stop' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})

describe('M05 task status unavailable commands', () => {
  it('marks banner and composer commands aria-disabled with stable explanation ids', async () => {
    await mount('task-failed-continue')
    const main = screen.getByRole('main')
    const continueBtn = within(main).getByRole('button', {
      name: 'Continue in a new session',
    })
    expect(continueBtn).toHaveAttribute('aria-disabled', 'true')
    expect(continueBtn).toHaveAttribute('aria-describedby', TASK_CONTINUE_UNAVAILABLE_ID)
    expect(
      document.getElementById(TASK_CONTINUE_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_CONTINUE_UNAVAILABLE_EXPLANATION)

    const copyBtn = within(main).getByRole('button', {
      name: 'Copy resume command',
    })
    expect(copyBtn).toHaveAttribute('aria-disabled', 'true')
    expect(copyBtn).toHaveAttribute('aria-describedby', TASK_COPY_RESUME_UNAVAILABLE_ID)
    expect(
      document.getElementById(TASK_COPY_RESUME_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION)
  })

  it('clicks unavailable commands without mutating task status, command chrome, or observation', async () => {
    const user = userEvent.setup()
    const app = await mount('task-owner-lost')
    const before = app.presenter.getState().task
    const main = screen.getByRole('main')
    const stopTask = within(main).getByRole('button', { name: 'Stop task' })
    const refresh = within(main).getByRole('button', { name: 'Refresh' })
    expect(stopTask).toHaveAttribute('aria-disabled', 'true')
    expect(stopTask).toHaveAttribute('aria-describedby', TASK_STOP_UNAVAILABLE_ID)
    expect(refresh).toHaveAttribute('aria-describedby', TASK_REFRESH_UNAVAILABLE_ID)
    expect(
      document.getElementById(TASK_STOP_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_STOP_UNAVAILABLE_EXPLANATION)
    expect(
      document.getElementById(TASK_REFRESH_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_REFRESH_UNAVAILABLE_EXPLANATION)
    await user.click(stopTask)
    await user.click(refresh)
    const after = app.presenter.getState().task
    expect(after.commandChrome).toBe(before.commandChrome)
    expect(after.selectedTaskId).toBe(before.selectedTaskId)
    expect(after.load).toEqual(before.load)
  })

  it('keeps Retry read unavailable on the status-unavailable notice', async () => {
    const user = userEvent.setup()
    const app = await mount('task-status-unavailable')
    const before = app.presenter.getState().task
    const retry = screen.getByRole('button', { name: 'Retry read' })
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveAttribute('aria-describedby', TASK_RETRY_READ_UNAVAILABLE_ID)
    expect(
      document.getElementById(TASK_RETRY_READ_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_RETRY_READ_UNAVAILABLE_EXPLANATION)
    await user.click(retry)
    expect(app.presenter.getState().task).toEqual(before)
  })

  it('keeps Check for a new task unavailable on launch-unknown', async () => {
    await mount('task-launch-unknown')
    const check = screen.getByRole('button', { name: 'Check for a new task' })
    expect(check).toHaveAttribute('aria-disabled', 'true')
    expect(check).toHaveAttribute(
      'aria-describedby',
      TASK_CHECK_NEW_TASK_UNAVAILABLE_ID,
    )
    expect(
      document.getElementById(TASK_CHECK_NEW_TASK_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_CHECK_NEW_TASK_UNAVAILABLE_EXPLANATION)
  })

  it('uses unique element ids on rich task states', async () => {
    await mount('task-launch-unknown')
    expectUniqueElementIds()
    cleanup()
    await mount('task-failed-continue')
    expectUniqueElementIds()
  })

  it('drops seeded stop-requested chrome from the screen when the route is left and the task is reopened', async () => {
    const app = await mount('task-stop-requested')
    expect(screen.getByText('Stop requested')).toBeInTheDocument()
    expect(app.presenter.getState().task.commandChrome).toBe('stop-requested')
    await act(async () => {
      app.presenter.navigate('resources')
      await Promise.resolve()
    })
    expect(app.presenter.getState().task.commandChrome).toBe(null)
    await act(async () => {
      app.presenter.openTask(TASK_STATUS_STOP_REQUESTED_ID)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(app.presenter.getState().task.selectedTaskId).toBe(
      TASK_STATUS_STOP_REQUESTED_ID,
    )
    expect(screen.queryByText('Stop requested')).not.toBeInTheDocument()
    expect(screen.getByText('Running 04:12')).toBeInTheDocument()
  })

  it('drops seeded chrome from the screen when the same task is reopened in place', async () => {
    const app = await mount('task-stop-requested')
    expect(screen.getByText('Stop requested')).toBeInTheDocument()
    await act(async () => {
      app.presenter.openTask(TASK_STATUS_STOP_REQUESTED_ID)
      await Promise.resolve()
    })
    expect(app.presenter.getState().task.commandChrome).toBe(null)
    expect(screen.queryByText('Stop requested')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('boots continue-started through PreviewShell seeding', async () => {
    window.location.hash = '#task-continue-started'
    render(<PreviewShell />)
    expect(
      await screen.findByText('New session accepted'),
    ).toBeInTheDocument()
    expectUniqueElementIds()
  })
})