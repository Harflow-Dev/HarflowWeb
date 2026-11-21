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
import type { ApprovalRespondOutcome } from '../model'
import { asTaskId } from '../model'
import { APPROVAL_COPY, APPROVAL_MAC_COPY } from '../presentation'
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

function commandCard(): HTMLElement {
  return screen.getByRole('region', { name: 'Wants to run a command' })
}

function publishCard(): HTMLElement {
  return screen.getByRole('region', { name: 'Wants to publish' })
}

type Deferred = {
  readonly promise: Promise<ApprovalRespondOutcome>
  resolve(outcome: ApprovalRespondOutcome): void
}

function deferred(): Deferred {
  let resolve!: (outcome: ApprovalRespondOutcome) => void
  const promise = new Promise<ApprovalRespondOutcome>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('Needs you approval flows', () => {
  it('stale Refresh advances to a decidable card', async () => {
    const user = userEvent.setup()
    await mount('needs-you-approval-stale')
    const root = commandCard()
    await user.click(
      within(root).getByRole('button', { name: APPROVAL_COPY.refresh }),
    )
    await settle()
    expect(
      within(commandCard()).getByRole('button', { name: APPROVAL_COPY.approveOnce }),
    ).toBeEnabled()
  })

  it('checkpoint Refresh with a new token becomes decidable', async () => {
    const user = userEvent.setup()
    await mount('needs-you-checkpoint-stale')
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    )
    await settle()
    expect(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.approve }),
    ).toBeEnabled()
  })

  it('focus moves to the result after a refusal', async () => {
    const user = userEvent.setup()
    const app = createApp('populated')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()

    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockResolvedValue({
      kind: 'refused',
      refusal: { reason: 'not_current' },
    })
    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    await settle()
    const result = commandCard().querySelector('.hd-approval__result')
    expect(result).toHaveFocus()
  })

  it('no double submit when leaving and returning mid-call', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()

    const hold = deferred()
    const spy = vi
      .spyOn(app.mock.engine, 'respondTaskApproval')
      .mockImplementation(() => hold.promise)

    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    expect(spy).toHaveBeenCalledTimes(1)

    await act(async () => {
      app.presenter.navigate('new-task')
      await Promise.resolve()
    })
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()

    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    expect(spy).toHaveBeenCalledTimes(1)

    await act(async () => {
      hold.resolve({
        kind: 'refused',
        refusal: { reason: 'not_current' },
      })
      await Promise.resolve()
    })
    await settle()
  })

  it('unknown respond leaves the card read-only with Refresh', async () => {
    const user = userEvent.setup()
    const app = createApp('populated')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()

    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    await settle()
    expect(
      within(commandCard()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeInTheDocument()
    expect(
      within(commandCard()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeEnabled()
  })

  it('unknown survive leave and return as read-only', async () => {
    const user = userEvent.setup()
    const app = createApp('populated')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    await settle()
    await act(async () => {
      app.presenter.navigate('new-task')
      await Promise.resolve()
    })
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    expect(
      within(commandCard()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeInTheDocument()
    expect(
      within(commandCard()).queryByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    ).toBeNull()
  })

  it('in-flight Needs you respond disables the same request on the task screen', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    const hold = deferred()
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockImplementation(
      () => hold.promise,
    )
    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    await act(async () => {
      app.presenter.openTask(asTaskId('task-slot-release'))
      await Promise.resolve()
    })
    await settle()
    const taskCard = screen.getByRole('group', { name: APPROVAL_COPY.ariaLabel })
    expect(
      within(taskCard).getByRole('button', { name: APPROVAL_COPY.approveOnce }),
    ).toBeDisabled()
    await act(async () => {
      hold.resolve({
        kind: 'refused',
        refusal: { reason: 'not_current' },
      })
      await Promise.resolve()
    })
  })

  it('unknown on Needs you makes the task screen card read-only', async () => {
    const user = userEvent.setup()
    const app = createApp('populated')
    render(<AppFeature presenter={app.presenter} />)
    await settle()
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    vi.spyOn(app.mock.engine, 'respondTaskApproval').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(
      within(commandCard()).getByRole('button', {
        name: APPROVAL_COPY.approveOnce,
      }),
    )
    await settle()
    await act(async () => {
      app.presenter.openTask(asTaskId('task-slot-release'))
      await Promise.resolve()
    })
    await settle()
    const taskCard = screen.getByRole('group', { name: APPROVAL_COPY.ariaLabel })
    expect(
      within(taskCard).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeInTheDocument()
    expect(
      within(taskCard).queryByRole('button', { name: APPROVAL_COPY.approveOnce }),
    ).toBeNull()
  })

  it('checkpoint answer unknown stays read-only with Refresh', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    vi.spyOn(app.mock.engine, 'answerWorkflowAttentionCheckpoint').mockRejectedValue(
      new Error('timeout'),
    )
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.approve }),
    )
    await settle()
    expect(
      within(publishCard()).getByText(APPROVAL_MAC_COPY.unconfirmed),
    ).toBeInTheDocument()
    expect(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeEnabled()
  })

  it('checkpoint answer accepted settles as Approved by you', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () => {
      app.presenter.navigate('needs-you')
      await Promise.resolve()
    })
    await settle()
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.approve }),
    )
    await settle()
    // The settled card stays in place; its header (and region name) now
    // reads the outcome instead of the action label.
    const settled = screen.getByRole('region', {
      name: APPROVAL_COPY.approvedByYou,
    })
    expect(
      within(settled).getByText(APPROVAL_COPY.approvedByYou),
    ).toBeInTheDocument()
    expect(
      within(settled).queryByRole('button', { name: APPROVAL_COPY.approve }),
    ).toBeNull()
    expect(
      screen.queryByRole('region', { name: 'Wants to publish' }),
    ).toBeNull()
  })

  it('same-token checkpoint Refresh through the session keeps stale', async () => {
    const user = userEvent.setup()
    const app = await mount('needs-you-checkpoint-stale')
    const refreshSpy = vi
      .spyOn(app.mock.engine, 'refreshWorkflowAttentionCheckpoint')
      .mockResolvedValue({
        kind: 'checkpoint',
        attentionCheckpointId:
          'attention:1111111111111111111111111111111111111111111111111111111111111111',
        pending: [
          {
            attentionCheckpointId:
              'attention:1111111111111111111111111111111111111111111111111111111111111111',
            nodeId: 'open-pull-request',
            path: ['run-nightly-dependency-audit', 'open-pull-request'],
            nodeTitle: 'Open pull request',
            reason: 'Caller guidance required',
            status: 'paused',
            exactAction:
              'Push branch deps/audit-2026-11-03 and open a pull request in HarflowMCP',
          },
        ],
      })
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    )
    await settle()
    expect(refreshSpy).toHaveBeenCalled()
    expect(
      within(publishCard()).getByText(APPROVAL_COPY.checkpointChanged),
    ).toBeInTheDocument()
    expect(
      within(publishCard()).queryByRole('button', { name: APPROVAL_COPY.approve }),
    ).toBeNull()
  })

  it('stale checkpoint draft is never replayed after Refresh', async () => {
    const user = userEvent.setup()
    const app = await mount('needs-you-checkpoint-stale')
    const answerSpy = vi.spyOn(
      app.mock.engine,
      'answerWorkflowAttentionCheckpoint',
    )
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    )
    await settle()
    expect(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.approve }),
    ).toBeEnabled()
    expect(answerSpy).not.toHaveBeenCalled()
    await user.click(
      within(publishCard()).getByRole('button', { name: APPROVAL_COPY.approve }),
    )
    await settle()
    expect(answerSpy).toHaveBeenCalledTimes(1)
    expect(answerSpy.mock.calls[0]?.[0]).toMatchObject({
      attentionCheckpointId:
        'attention:2222222222222222222222222222222222222222222222222222222222222222',
    })
  })
})
