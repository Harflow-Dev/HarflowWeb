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
import { applyNewTaskSeed, createApp } from '../composition'
import { APPROVAL_COPY } from '../presentation'
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

function commandCard(): HTMLElement {
  return screen.getByRole('region', { name: 'Wants to run a command' })
}

function publishCard(): HTMLElement {
  return screen.getByRole('region', { name: 'Wants to publish' })
}

describe('Needs you approval scenarios', () => {
  it('approval-stale: not_current + Refresh; waiting count 3; Open task works', async () => {
    const user = userEvent.setup()
    const app = await mount('needs-you-approval-stale')
    const root = commandCard()
    expect(within(root).getByText(APPROVAL_COPY.notCurrent)).toBeInTheDocument()
    expect(
      within(root).getByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeEnabled()
    const result = root.querySelector('.hd-approval__result')
    expect(result?.getAttribute('role')).toBe('status')
    expect(result?.getAttribute('aria-live')).toBeNull()
    expect(screen.getByText('3 waiting')).toBeInTheDocument()

    await user.click(
      within(root).getByRole('button', {
        name: 'Open task Fix flaky slot release test',
      }),
    )
    expect(app.presenter.getState().route).toBe('task')
  })

  it('approval-expired: Expired facts, no Refresh, waiting count 2', async () => {
    await mount('needs-you-approval-expired')
    const root = commandCard()
    expect(within(root).getByText(APPROVAL_COPY.expired)).toBeInTheDocument()
    expect(
      within(root).getByText('Effective decision: reject'),
    ).toBeInTheDocument()
    expect(
      within(root).queryByText(/Answered by the caller/),
    ).not.toBeInTheDocument()
    expect(
      within(root).queryByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeNull()
    expect(screen.getByText('2 waiting')).toBeInTheDocument()
  })

  it('answered-elsewhere: raceCaller title, recorded decision, waiting 2', async () => {
    await mount('needs-you-answered-elsewhere')
    const root = commandCard()
    expect(within(root).getByText(APPROVAL_COPY.raceCaller)).toBeInTheDocument()
    expect(within(root).getByText('Oct 14, 2026, 5:46 PM')).toBeInTheDocument()
    expect(
      within(root).getByText('Recorded decision: approve'),
    ).toBeInTheDocument()
    expect(
      within(root).queryByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeNull()
    expect(screen.getByText('2 waiting')).toBeInTheDocument()
  })

  it('checkpoint-stale: changed copy + Refresh; Open run works', async () => {
    const user = userEvent.setup()
    const app = await mount('needs-you-checkpoint-stale')
    const root = publishCard()
    expect(
      within(root).getByText(APPROVAL_COPY.checkpointChanged),
    ).toBeInTheDocument()
    expect(
      within(root).getByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeEnabled()
    expect(screen.getByText('3 waiting')).toBeInTheDocument()

    await user.click(
      within(root).getByRole('button', {
        name: 'Open run Nightly dependency audit',
      }),
    )
    expect(app.presenter.getState().route).toBe('workflows')
  })
})
