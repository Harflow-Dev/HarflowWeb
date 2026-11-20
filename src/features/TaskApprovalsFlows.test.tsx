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
import { applyNewTaskSeed, createApp } from '../composition'
import {
  type ApprovalRespondOutcome,
  asTaskId,
  type RespondTaskApprovalRequest,
} from '../model'
import {
  APPROVAL_COPY,
  APPROVAL_MAC_COPY,
  type TaskApprovalChrome,
} from '../presentation'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function settle() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function mount(scenario: ScenarioId) {
  const app = createApp(scenario)
  render(<AppFeature presenter={app.presenter} />)
  await settle()
  await act(async () => {
    applyNewTaskSeed(app.presenter, scenarioById(scenario).seed)
    await Promise.resolve()
    await Promise.resolve()
  })
  return app
}

type App = Awaited<ReturnType<typeof mount>>

function card(): HTMLElement {
  return screen.getByRole('group', { name: APPROVAL_COPY.ariaLabel })
}

function button(name: string): HTMLElement {
  return within(card()).getByRole('button', { name })
}

function maybeButton(name: string): HTMLElement | null {
  return within(card()).queryByRole('button', { name })
}

function approvalRow(app: App) {
  const load = app.presenter.getState().task.load
  return load.kind === 'ready' ? load.observation.approval : undefined
}

function chrome(app: App): TaskApprovalChrome {
  return app.presenter.getState().task.approvalChrome
}

function sidebarGlyph(): string | null {
  const row = screen.getByRole('button', {
    name: /Fix flaky slot release test/,
  })
  return row.querySelector('.hd-glyph')?.className ?? null
}

type Deferred = {
  readonly promise: Promise<ApprovalRespondOutcome>
  resolve(outcome: ApprovalRespondOutcome): void
  reject(): void
}

function deferred(): Deferred {
  let resolve!: (outcome: ApprovalRespondOutcome) => void
  let reject!: () => void
  const promise = new Promise<ApprovalRespondOutcome>((res, rej) => {
    resolve = res
    reject = () => rej(new Error('timeout'))
  })
  return { promise, resolve, reject }
}

describe('approval answers through the mock engine', () => {
  it('Approve once answers through Monitor and settles as Approved by you', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    expect(sidebarGlyph()).toContain('hd-glyph--attention')
    const spy = vi.spyOn(app.mock.engine, 'respondTaskApproval')
    await user.click(button(APPROVAL_COPY.approveOnce))
    await settle()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toMatchObject({
      decision: 'approve',
      ownerRevision: 1,
    })
    expect(within(card()).getByText(APPROVAL_COPY.approvedByYou)).toBeVisible()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
    expect(maybeButton(APPROVAL_COPY.refresh)).toBeNull()
    expect(approvalRow(app)).toMatchObject({
      decision: 'approve',
      decidedBy: 'caller',
      responder: 'monitor',
      disposition: 'pending',
      delivery: 'reserved',
    })
    expect(
      document.querySelector('.hd-badge.hd-badge--attention'),
    ).toBeNull()
    expect(sidebarGlyph()).toContain('hd-glyph--running')
    expect(document.activeElement).toBe(card())
  })

  it('Reject settles as Rejected by you with no refusal copy', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    await user.click(button(APPROVAL_COPY.reject))
    await settle()
    expect(within(card()).getByText(APPROVAL_COPY.rejectedByYou)).toBeVisible()
    expect(within(card()).queryByText(APPROVAL_COPY.notCurrent)).toBeNull()
    expect(maybeButton(APPROVAL_COPY.refresh)).toBeNull()
    expect(approvalRow(app)).toMatchObject({
      decision: 'reject',
      responder: 'monitor',
    })
  })

  it('disables both decisions while a respond is in flight', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    const pending = deferred()
    const spy = vi
      .spyOn(app.mock.engine, 'respondTaskApproval')
      .mockImplementation(() => pending.promise)
    await user.click(button(APPROVAL_COPY.approveOnce))
    expect(button(APPROVAL_COPY.approveOnce)).toBeDisabled()
    expect(button(APPROVAL_COPY.reject)).toBeDisabled()
    await user.click(button(APPROVAL_COPY.reject))
    expect(spy).toHaveBeenCalledTimes(1)
    const row = approvalRow(app)
    await act(async () => {
      pending.resolve({
        kind: 'accepted',
        request: { ...row!, decision: 'approve', delivery: 'reserved' },
      })
      await Promise.resolve()
    })
    expect(within(card()).getByText(APPROVAL_COPY.approvedByYou)).toBeVisible()
  })

  it('a refresh during a respond is ignored and keeps the respond result', async () => {
    const app = await mount('approval-exact')
    const pending = deferred()
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockImplementation(
      () => pending.promise,
    )
    const refresh = vi.spyOn(app.mock.engine, 'refreshTaskApproval')
    act(() => app.presenter.respondTaskApproval('approve'))
    act(() => app.presenter.refreshTaskApproval())
    expect(refresh).not.toHaveBeenCalled()
    expect(button(APPROVAL_COPY.approveOnce)).toBeDisabled()
    await act(async () => {
      pending.resolve({ kind: 'refused', refusal: { reason: 'settled' } })
      await Promise.resolve()
    })
    expect(within(card()).getByText(APPROVAL_COPY.settled)).toBeVisible()
  })
})

describe('uncertain and untyped outcomes', () => {
  it('unknown outcome removes the buttons and never restores them', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(button(APPROVAL_COPY.approveOnce))
    await settle()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
    expect(maybeButton(APPROVAL_COPY.reject)).toBeNull()
    expect(
      within(card()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeVisible()

    // A successful re-read of the same revision stays read-only.
    await user.click(button(APPROVAL_COPY.refresh))
    await settle()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
    expect(
      within(card()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeVisible()
    expect(maybeButton(APPROVAL_COPY.refresh)).not.toBeNull()
  })

  it('a re-read with a new owner revision is decidable again', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(button(APPROVAL_COPY.approveOnce))
    await settle()
    const row = approvalRow(app)!
    vi.spyOn(app.mock.engine, 'refreshTaskApproval').mockResolvedValue({
      ...row,
      ownerRevision: row.ownerRevision + 1,
    })
    await user.click(button(APPROVAL_COPY.refresh))
    await settle()
    expect(button(APPROVAL_COPY.approveOnce)).toBeEnabled()
    expect(
      within(card()).queryByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeNull()
  })

  it('an unknown outcome landing while another task is open is kept', async () => {
    const app = await mount('approval-exact')
    const pending = deferred()
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockImplementation(
      () => pending.promise,
    )
    act(() => app.presenter.respondTaskApproval('approve'))
    act(() => app.presenter.openTask(asTaskId('task-approval-stale')))
    await settle()
    await act(async () => {
      applyNewTaskSeed(
        app.presenter,
        scenarioById('approval-stale').seed,
      )
      await Promise.resolve()
    })
    const focusBefore = chrome(app).focusResultSeq
    await act(async () => {
      pending.reject()
      await Promise.resolve()
    })
    // Same request id and revision, different task: the stale card is untouched.
    expect(within(card()).getByText(APPROVAL_COPY.notCurrent)).toBeVisible()
    expect(
      within(card()).queryByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeNull()
    expect(chrome(app).focusResultSeq).toBe(focusBefore)
    act(() => app.presenter.openTask(asTaskId('task-approval-exact')))
    await settle()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
    expect(
      within(card()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeVisible()
  })

  it('leaving and returning mid-call cannot submit twice', async () => {
    const app = await mount('approval-exact')
    const pending = deferred()
    const spy = vi
      .spyOn(app.mock.engine, 'respondTaskApproval')
      .mockImplementation(() => pending.promise)
    act(() => app.presenter.respondTaskApproval('approve'))
    act(() => app.presenter.openTask(asTaskId('task-approval-stale')))
    await settle()
    act(() => app.presenter.openTask(asTaskId('task-approval-exact')))
    await settle()
    expect(chrome(app).submitting).toBe(true)
    expect(button(APPROVAL_COPY.approveOnce)).toBeDisabled()
    act(() => app.presenter.respondTaskApproval('reject'))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('a failed refresh keeps the existing refusal', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-stale')
    vi.spyOn(app.mock.engine, 'refreshTaskApproval').mockRejectedValue(
      new Error('offline'),
    )
    await user.click(button(APPROVAL_COPY.refresh))
    await settle()
    expect(within(card()).getByText(APPROVAL_COPY.notCurrent)).toBeVisible()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
    expect(maybeButton(APPROVAL_COPY.refresh)).not.toBeNull()
  })

  it('stale Refresh returns the current revision as a decidable card', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-stale')
    await user.click(button(APPROVAL_COPY.refresh))
    await settle()
    expect(approvalRow(app)?.ownerRevision).toBe(2)
    expect(button(APPROVAL_COPY.approveOnce)).toBeEnabled()
    expect(document.activeElement).toBe(card())
    expect(document.activeElement).not.toBe(button(APPROVAL_COPY.approveOnce))
  })

  it('a stale revision is refused as not_current before row state', async () => {
    const app = await mount('approval-stale')
    const request: RespondTaskApprovalRequest = {
      taskId: 'task-approval-stale',
      requestId: '00000000000000000000000000000001',
      decision: 'approve',
      ownerRevision: 1,
      actionDigest: approvalRow(app)!.actionDigest,
    }
    expect(await app.mock.engine.respondTaskApproval(request)).toEqual({
      kind: 'refused',
      refusal: { reason: 'not_current' },
    })
  })
})

describe('typed refusals drawn through the card', () => {
  it.each([
    ['expired', APPROVAL_MAC_COPY.expired, false],
    ['ownership_lost', APPROVAL_MAC_COPY.ownershipLost, true],
    ['unauthorized', APPROVAL_MAC_COPY.unauthorized, true],
    ['unsupported', APPROVAL_MAC_COPY.unsupported, true],
    ['caller_undecidable', APPROVAL_MAC_COPY.callerUndecidable, true],
    ['incomplete', APPROVAL_MAC_COPY.incomplete, true],
  ])('%s', async (reason, line, refresh) => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockResolvedValue({
      kind: 'refused',
      refusal: { reason },
    })
    await user.click(button(APPROVAL_COPY.approveOnce))
    await settle()
    expect(within(card()).getByText(line)).toBeVisible()
    expect(maybeButton(APPROVAL_COPY.refresh) !== null).toBe(refresh)
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
  })

  it('an untyped refusal reason is non-actionable', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockResolvedValue({
      kind: 'refused',
      refusal: {},
    })
    await user.click(button(APPROVAL_COPY.approveOnce))
    await settle()
    await user.click(button(APPROVAL_COPY.refresh))
    await settle()
    expect(
      within(card()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeVisible()
    expect(maybeButton(APPROVAL_COPY.approveOnce)).toBeNull()
  })

  it('answered-elsewhere ledger row is not read as answered by you', async () => {
    const app = await mount('approval-answered-elsewhere')
    expect(
      within(card()).queryByText(APPROVAL_COPY.approvedByYou),
    ).toBeNull()
    expect(approvalRow(app)).toMatchObject({
      responder: 'monitor',
      delivery: 'reserved',
    })
    const load = app.presenter.getState().task.load
    expect(
      load.kind === 'ready' ? load.observation.approvalSummary : null,
    ).toEqual({ awaitingDecisionCount: 0 })
  })
})
