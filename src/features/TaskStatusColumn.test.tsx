import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import {
  TASK_COPY_REQUEST_UNAVAILABLE_ID,
  TASK_BANNER_CAPTION_ID,
  TASK_CONTINUE_UNAVAILABLE_ID,
  TASK_OPEN_SLOTS_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_SLOTS_UNAVAILABLE_ID,
} from '../components/taskUnavailable'
import { applyNewTaskSeed, createApp } from '../composition'
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

const ALL_STATES = [
  'running-stop',
  'stop-requested',
  'cancelled',
  'timed-out',
  'settling',
  'unknown-failed',
  'unknown-done',
  'owner-lost',
  'unverified',
  'launch-unknown',
  'status-unavailable',
  'pending',
  'taken-over',
  'continue-starting',
  'continue-started',
  'failed-continue',
].map((state) => `task-${state}` as ScenarioId)

const NOTICE_STATES = [
  'task-stop-requested',
  'task-settling',
  'task-continue-started',
  'task-unknown-done',
  'task-status-unavailable',
] as const satisfies readonly ScenarioId[]

const BANNER_STATES = [
  'task-cancelled',
  'task-timed-out',
  'task-unknown-failed',
  'task-owner-lost',
  'task-unverified',
  'task-launch-unknown',
  'task-continue-starting',
  'task-failed-continue',
] as const satisfies readonly ScenarioId[]

const ROW_SELECTOR = '.hd-msg-agent, .hd-tool, .hd-working, .hd-turn-sep'

function column(): HTMLElement {
  const el = screen.getByRole('main').querySelector('.hd-m05-scroll')
  if (!(el instanceof HTMLElement)) throw new Error('no M05 scroller')
  return el
}

function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('M05 conversation column structure', () => {
  it.each(NOTICE_STATES)(
    'puts the %s notice after the request head and before the first row',
    async (scenario) => {
      await mount(scenario)
      const scroller = column()
      const notice = scroller.querySelector('.hd-m05-notice')
      const request = scroller.querySelector('.hd-m05-request')
      const firstRow = scroller.querySelector(ROW_SELECTOR)
      expect(notice).not.toBeNull()
      expect(request).not.toBeNull()
      expect(firstRow).not.toBeNull()
      expect(precedes(request!, notice!)).toBe(true)
      expect(precedes(notice!, firstRow!)).toBe(true)
      // The notice is inside the scroller, not a fixed sibling.
      expect(scroller.contains(notice)).toBe(true)
    },
  )

  it.each(BANNER_STATES)(
    'puts the %s banner after the last row, inside the scroller',
    async (scenario) => {
      await mount(scenario)
      const scroller = column()
      const banner = scroller.querySelector('.hd-banner')
      const rows = scroller.querySelectorAll(ROW_SELECTOR)
      expect(banner).not.toBeNull()
      expect(rows.length).toBeGreaterThan(0)
      expect(precedes(rows[rows.length - 1]!, banner!)).toBe(true)
      expect(scroller.contains(banner)).toBe(true)
      // The banner closes the transcript content; only its caption may follow.
      const tail = banner!.nextElementSibling
      expect(tail === null || tail.classList.contains('hd-m05-caption')).toBe(
        true,
      )
      const last = banner!.parentElement!.lastElementChild
      expect(last === banner || last === tail).toBe(true)
      if (tail) expect(tail.nextElementSibling).toBeNull()
    },
  )

  it.each(ALL_STATES)(
    'draws %s without speaker labels, history header or live strip',
    async (scenario) => {
      await mount(scenario)
      const scroller = column()
      const main = screen.getByRole('main')
      for (const label of ['Claude', 'Codex']) {
        expect(
          within(scroller).queryByText(label, { selector: 'strong' }),
        ).toBeNull()
      }
      expect(main.querySelector('[class*="hd-d2b"]')).toBeNull()
      expect(main.querySelector('[data-d2b-live], [data-row]')).toBeNull()
      expect(main.textContent).not.toMatch(
        /Captured activity caught up|Load earlier|Verified stored request|Capture gap/,
      )
      // Request is a collapsed disclosure, or the pending note.
      const details = scroller.querySelector('details.hd-m05-request')
      if (scenario === 'task-pending') {
        expect(details).toBeNull()
      } else {
        expect(details).not.toBeNull()
        expect(details!.hasAttribute('open')).toBe(false)
      }
    },
  )

  it('keeps StatusRegion the only live region on all 16 states', async () => {
    for (const scenario of ALL_STATES) {
      await mount(scenario)
      const live = [
        ...document.querySelectorAll(
          '[role="status"], [role="alert"], [role="log"], [aria-live]',
        ),
      ]
      expect(
        live.map((el) => el.classList.contains('hw-status')),
        scenario,
      ).toEqual([true])
      cleanup()
    }
  })
})

describe('M05 conversation rows', () => {
  it('draws the running-stop rows with the failing pytest run', async () => {
    await mount('task-running-stop')
    const scroller = column()
    expect(within(scroller).getByText('Read 4 files')).toBeInTheDocument()
    expect(scroller.textContent).toContain('2 failed, 18 passed')
    expect(scroller.textContent).toContain(
      'FAILED tests/test_slots.py::test_release_frees_slot[7]',
    )
    expect(within(scroller).getByText('harflow_mcp/slots.py')).toBeInTheDocument()
    expect(within(scroller).getByText('Running tests…')).toBeInTheDocument()
  })

  it('draws the failed-continue rows', async () => {
    await mount('task-failed-continue')
    const scroller = column()
    expect(within(scroller).getByText('Read 5 files')).toBeInTheDocument()
    expect(
      within(scroller).getByText('harflow_mcp/events/reader.py'),
    ).toBeInTheDocument()
    expect(scroller.textContent).toContain('1 failed, 14 passed')
  })

  it('draws settling with its Summary separator and one summary paragraph', async () => {
    await mount('task-settling')
    const scroller = column()
    expect(within(scroller).getByText('Read 6 files')).toBeInTheDocument()
    const summary = within(scroller).getByText('Summary')
    expect(summary).toHaveClass('hd-turn-sep')
    const paragraph = summary.nextElementSibling
    expect(paragraph?.textContent).toBe(
      'Deliveries now have a retry budget of 5 attempts per hour per target. When the budget is spent, the delivery is marked exhausted.',
    )
    expect(paragraph?.querySelectorAll('p')).toHaveLength(1)
    expect(scroller.querySelector('ul')).toBeNull()
  })

  it('uses the one-paragraph summary on unknown-done, not the long task/done summary', async () => {
    await mount('task-unknown-done')
    const scroller = column()
    expect(within(scroller).getByText('Summary')).toBeInTheDocument()
    expect(scroller.querySelector('ul')).toBeNull()
    expect(scroller.textContent).not.toContain('HARFLOW_DELIVERY_RETRY_BUDGET')
  })

  it('expands the stored request on demand', async () => {
    const user = userEvent.setup()
    await mount('task-running-stop')
    const details = column().querySelector('details.hd-m05-request')!
    await user.click(within(details as HTMLElement).getByText('Original request'))
    expect(details.hasAttribute('open')).toBe(true)
    expect(details.querySelector('pre')?.textContent).toBe(
      'The test_release_frees_slot test in tests/test_slots.py fails about one run in ten. Find out why and fix it without adding sleeps.',
    )
    const copy = within(details as HTMLElement).getByRole('button', {
      name: 'Copy original request',
    })
    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(copy).toHaveAttribute(
      'aria-describedby',
      TASK_COPY_REQUEST_UNAVAILABLE_ID,
    )
  })
})

describe('M05 fixture identity', () => {
  it('draws timed-out as the failed task with no failure banner', async () => {
    await mount('task-timed-out')
    const main = screen.getByRole('main')
    expect(
      within(main).getByText('Migrate events.jsonl reader'),
    ).toBeInTheDocument()
    expect(within(main).getByText('Timed out 12:40')).toBeInTheDocument()
    expect(main.querySelector('.hw-m05-meta')?.textContent).toBe(
      'Claude · Opus 5.5 · HarflowMCP',
    )
    expect(
      within(main).getByText('This run stopped at its turn limit'),
    ).toBeInTheDocument()
    expect(
      within(main).queryByText('Task failed: the harness exited with code 1'),
    ).toBeNull()
    expect(column().textContent).toContain('Read 5 files')
  })

  it('shows two turns in the continue-started meta line', async () => {
    await mount('task-continue-started')
    const main = screen.getByRole('main')
    expect(main.querySelector('.hw-m05-meta')?.textContent).toBe(
      'Claude · Opus 5.5 · HarflowMCP · 2 turns',
    )
  })
})

describe('M05 pending resource card', () => {
  it('draws the waiting card with an unavailable Open resource slots control', async () => {
    const user = userEvent.setup()
    const app = await mount('task-pending')
    const main = screen.getByRole('main')
    expect(within(main).getByText('Waiting for resources')).toBeInTheDocument()
    expect(
      within(main).getByText('This task has no record yet and has not started.'),
    ).toBeInTheDocument()
    expect(
      within(main).getByText(
        'The engine reports launch state only here. Slot details are on the Resources screen.',
      ),
    ).toBeInTheDocument()
    expect(main.querySelector('.hd-topbar__meta')).toBeNull()
    const open = within(main).getByRole('button', {
      name: 'Open resource slots',
    })
    expect(open).toHaveAttribute('aria-disabled', 'true')
    expect(open).toHaveAttribute('aria-describedby', TASK_OPEN_SLOTS_UNAVAILABLE_ID)
    expect(
      document.getElementById(TASK_OPEN_SLOTS_UNAVAILABLE_ID)?.textContent,
    ).toBe(TASK_OPEN_SLOTS_UNAVAILABLE_EXPLANATION)
    const before = app.presenter.getState()
    await user.click(open)
    const after = app.presenter.getState()
    expect(after.route).toBe(before.route)
    expect(after.task).toEqual(before.task)
  })
})

describe('M05 banner drawing', () => {
  it('draws the caption after the banner box, not inside it', async () => {
    await mount('task-failed-continue')
    const banner = column().querySelector('.hd-banner')!
    expect(banner.querySelector('.hd-m05-caption')).toBeNull()
    expect(banner.nextElementSibling?.textContent).toBe(
      'A new session starts from the stored request, summary and outcome. It can repeat work already done. Files are not rolled back.',
    )
  })

  it('uses the drawn button emphasis and icons', async () => {
    await mount('task-owner-lost')
    const main = screen.getByRole('main')
    const stop = within(main).getByRole('button', { name: 'Stop task' })
    const refresh = within(main).getByRole('button', { name: 'Refresh' })
    expect(stop).toHaveClass('hd-btn--danger')
    expect(refresh).toHaveClass('hd-btn--ghost')
    expect(refresh.querySelector('.hd-i')).toBeNull()
    cleanup()
    await mount('task-unverified')
    expect(
      screen.getByRole('button', { name: 'Refresh' }),
    ).toHaveClass('hd-btn--secondary')
    cleanup()
    await mount('task-launch-unknown')
    expect(
      screen.getByRole('button', { name: 'Check for a new task' }),
    ).toHaveClass('hd-btn--secondary')
  })
})

describe('M05 disabled drawing', () => {
  it('draws only the unknown-failed Continue disabled among banner commands', async () => {
    await mount('task-unknown-failed')
    const main = screen.getByRole('main')
    const cont = within(main).getByRole('button', {
      name: 'Continue in a new session',
    })
    expect(cont).toHaveClass('is-disabled')
    expect(cont.getAttribute('aria-describedby')).toBe(
      `${TASK_BANNER_CAPTION_ID} ${TASK_CONTINUE_UNAVAILABLE_ID}`,
    )
    expect(document.getElementById(TASK_BANNER_CAPTION_ID)?.textContent).toBe(
      'Continue needs an observed exit and fully read output, which this run does not have.',
    )
    for (const name of ['Copy resume command', 'Open Events']) {
      expect(within(main).getByRole('button', { name })).not.toHaveClass(
        'is-disabled',
      )
    }
    cleanup()
    await mount('task-failed-continue')
    expect(
      screen.getByRole('button', { name: 'Continue in a new session' }),
    ).not.toHaveClass('is-disabled')
  })
})

describe('task-done scenario', () => {
  it('boots onto the retry-budget task with its Changes pane open', async () => {
    const app = await mount('task-done')
    const state = app.presenter.getState()
    expect(state.task.selectedTaskId).toBe('task-retry-budget-done')
    expect(state.task.changesPaneOpen).toBe(true)
    expect(
      within(screen.getByRole('main')).getByText('Add retry budget to delivery queue'),
    ).toBeInTheDocument()
  })
})
