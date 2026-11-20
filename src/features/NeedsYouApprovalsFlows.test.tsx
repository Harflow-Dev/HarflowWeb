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
})
