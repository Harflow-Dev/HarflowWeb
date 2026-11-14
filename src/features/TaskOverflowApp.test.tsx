import {
  act,
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import { RETRY_BUDGET_DONE_TASK_ID } from '../adapters/mock/taskFixtures'
import { TASK_OVERFLOW_PARENT_ID } from '../adapters/mock/taskOverflowFixtures'
import {
  TASK_STATUS_PENDING_ID,
  TASK_STATUS_RUNNING_STOP_ID,
} from '../adapters/mock/taskStatusFixtures'
import { applyNewTaskSeed, createApp, PreviewShell } from '../composition'
import {
  TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_TERMINAL_UNAVAILABLE_EXPLANATION,
  TASK_OVERFLOW_COPY,
  TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION,
  TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION,
} from '../presentation'
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

function sidebar(): HTMLElement {
  return screen.getByRole('complementary', { name: 'Sidebar' })
}

function statusRegion(): HTMLElement {
  return document.querySelector('.hw-status') as HTMLElement
}

describe('Task overflow menu', () => {
  it('opens from More actions, focuses the first item, and closes on Escape', async () => {
    const user = userEvent.setup()
    await mount('task-running-stop')
    const more = screen.getByRole('button', { name: 'More actions' })
    expect(more).toHaveAttribute('aria-haspopup', 'menu')
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: 'More actions' })
    const first = within(menu).getByRole('menuitem', { name: /Stop task/ })
    expect(first).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(more).toHaveFocus()
  })

  it('roves with arrow keys and keeps unavailable items in order', async () => {
    const user = userEvent.setup()
    await mount('task-overflow-running')
    const menu = screen.getByRole('menu', { name: 'More actions' })
    const items = within(menu).getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    const resume = within(menu).getByRole('menuitem', {
      name: /Copy resume command/,
    })
    expect(resume).toHaveAttribute('aria-disabled', 'true')
    expect(resume).toHaveAccessibleDescription(
      TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION,
    )
    resume.focus()
    await user.keyboard('{ArrowDown}')
    expect(
      within(menu).getByRole('menuitem', { name: /Copy task ID/ }),
    ).toHaveFocus()
  })

  it('lists settled items without Stop and with unavailable Open in terminal', async () => {
    await mount('task-overflow-settled')
    const menu = screen.getByRole('menu', { name: 'More actions' })
    expect(
      within(menu).queryByRole('menuitem', { name: /Stop task/ }),
    ).toBeNull()
    const terminal = within(menu).getByRole('menuitem', {
      name: /Open in terminal/,
    })
    expect(terminal).toHaveAttribute('aria-disabled', 'true')
    expect(terminal).toHaveAccessibleDescription(
      TASK_OPEN_TERMINAL_UNAVAILABLE_EXPLANATION,
    )
    expect(within(menu).getByText('HarflowWeb')).toBeInTheDocument()
    expect(RETRY_BUDGET_DONE_TASK_ID).toBeTruthy()
  })

  it('shows Open parent task on a sub-task and navigates to the parent', async () => {
    const user = userEvent.setup()
    const app = await mount('task-overflow-subtask')
    expect(
      screen.getByText(TASK_OVERFLOW_COPY.provenanceLine),
    ).toBeInTheDocument()
    const menu = screen.getByRole('menu', { name: 'More actions' })
    const parent = within(menu).getByRole('menuitem', {
      name: /Open parent task/,
    })
    expect(parent.textContent).toContain('Started by Nightly dependency audit')
    await user.click(parent)
    expect(app.presenter.getState().task.selectedTaskId).toBe(
      TASK_OVERFLOW_PARENT_ID,
    )
  })

  it('omits terminal and resume items when status is unavailable', async () => {
    const user = userEvent.setup()
    await mount('task-status-unavailable')
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    const menu = screen.getByRole('menu', { name: 'More actions' })
    expect(
      within(menu).queryByRole('menuitem', { name: /Stop task/ }),
    ).toBeNull()
    expect(
      within(menu).queryByRole('menuitem', { name: /terminal/i }),
    ).toBeNull()
    expect(
      within(menu).queryByRole('menuitem', { name: /Copy resume/ }),
    ).toBeNull()
    expect(
      within(menu).getByRole('menuitem', { name: /Copy task ID/ }),
    ).toBeInTheDocument()
  })

  it('shows Stop for pending without terminal items', async () => {
    const user = userEvent.setup()
    const app = createApp('task-pending')
    render(<AppFeature presenter={app.presenter} />)
    await act(async () => {
      app.presenter.openTask(TASK_STATUS_PENDING_ID)
      await Promise.resolve()
      await Promise.resolve()
    })
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    const menu = screen.getByRole('menu', { name: 'More actions' })
    expect(
      within(menu).getByRole('menuitem', { name: /Stop task/ }),
    ).toBeInTheDocument()
    expect(
      within(menu).queryByRole('menuitem', { name: /terminal/i }),
    ).toBeNull()
  })
})

describe('Task Stop and takeover dialogs', () => {
  it('opens Stop from the composer and menu, with focus trap and return', async () => {
    const user = userEvent.setup()
    await mount('task-running-stop')
    const composerStop = screen.getByRole('button', { name: 'Stop' })
    await user.click(composerStop)
    const dialog = screen.getByRole('dialog', {
      name: TASK_OVERFLOW_COPY.stopDialogTitle,
    })
    expect(
      within(dialog).getByRole('button', { name: 'Keep running' }),
    ).toHaveFocus()
    expect(sidebar()).toHaveAttribute('inert')
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert')
    const confirm = within(dialog).getByRole('button', { name: 'Stop task' })
    expect(confirm).toBeDisabled()
    expect(confirm).toHaveAccessibleDescription(
      TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION,
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(composerStop).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: /Stop task/ }))
    expect(
      screen.getByRole('dialog', { name: TASK_OVERFLOW_COPY.stopDialogTitle }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep running' }))
    expect(screen.getByRole('button', { name: 'More actions' })).toHaveFocus()
  })

  it('opens Stop from the owner-lost banner', async () => {
    const user = userEvent.setup()
    await mount('task-owner-lost')
    await user.click(screen.getByRole('button', { name: 'Stop task' }))
    expect(
      screen.getByRole('dialog', { name: TASK_OVERFLOW_COPY.stopDialogTitle }),
    ).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Stop task' })).toHaveFocus()
  })

  it('seeds the earlier-turns dialog with the derived list', async () => {
    await mount('task-stop-dialog-earlier-turns')
    const dialog = screen.getByRole('dialog', {
      name: TASK_OVERFLOW_COPY.stopDialogTitle,
    })
    expect(
      within(dialog).getByText(TASK_OVERFLOW_COPY.wontBeStoppedHeading),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Rebuild the index')).toBeInTheDocument()
    expect(
      within(dialog).getByText(TASK_OVERFLOW_COPY.wontBeStoppedCaption),
    ).toBeInTheDocument()
  })

  it('seeds takeover with access level and keeps confirm unavailable', async () => {
    await mount('task-takeover-dialog')
    const dialog = screen.getByRole('dialog', {
      name: TASK_OVERFLOW_COPY.takeoverDialogTitle,
    })
    expect(dialog.textContent).toContain('Can edit this repo')
    const confirm = within(dialog).getByRole('button', {
      name: TASK_OVERFLOW_COPY.takeoverConfirm,
    })
    expect(confirm).toBeDisabled()
    expect(confirm).toHaveAccessibleDescription(
      TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION,
    )
  })

  it('copies task ID through StatusRegion', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    await mount('task-overflow-running')
    const menu = screen.getByRole('menu', { name: 'More actions' })
    await user.click(
      within(menu).getByRole('menuitem', { name: /Copy task ID/ }),
    )
    expect(writeText).toHaveBeenCalledWith(TASK_STATUS_RUNNING_STOP_ID)
    expect(statusRegion().textContent).toContain('Copied task ID')
  })

  it('does not mutate observation when Stop confirm stays unavailable', async () => {
    const app = await mount('task-stop-dialog')
    const before = app.presenter.getState().task.load
    expect(app.presenter.getState().task.dialog).toBe('stop')
    expect(app.presenter.getState().task.commandChrome).toBeNull()
    expect(app.presenter.getState().task.load).toEqual(before)
  })
})

describe('Task overflow preview scenarios', () => {
  it('boots overflow-running through the seeding path', async () => {
    window.location.hash = '#task-overflow-running'
    render(<PreviewShell />)
    expect(
      await screen.findByRole('menu', { name: 'More actions' }),
    ).toBeInTheDocument()
  })

  it('boots stop-dialog through the seeding path', async () => {
    window.location.hash = '#task-stop-dialog'
    render(<PreviewShell />)
    expect(
      await screen.findByRole('dialog', {
        name: TASK_OVERFLOW_COPY.stopDialogTitle,
      }),
    ).toBeInTheDocument()
  })
})
