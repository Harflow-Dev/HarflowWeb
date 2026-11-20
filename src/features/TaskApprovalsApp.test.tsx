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

function card(): HTMLElement {
  return screen.getByRole('group', { name: APPROVAL_COPY.ariaLabel })
}

describe('Task screen approval scenarios', () => {
  it('approval-exact draws Approve once and Reject', async () => {
    await mount('approval-exact')
    const root = card()
    expect(
      within(root).getByRole('button', { name: APPROVAL_COPY.approveOnce }),
    ).toBeEnabled()
    expect(
      within(root).getByRole('button', { name: APPROVAL_COPY.reject }),
    ).toBeEnabled()
    expect(
      document.querySelector('.hd-badge.hd-badge--attention')?.textContent,
    ).toContain('Needs you')
  })

  it('approval-stale draws not_current copy, Refresh, and no live region', async () => {
    await mount('approval-stale')
    const root = card()
    expect(within(root).getByText(APPROVAL_COPY.notCurrent)).toBeInTheDocument()
    expect(
      within(root).getByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeEnabled()
    const result = root.querySelector('.hd-approval__result')
    expect(result?.getAttribute('role')).toBe('status')
    expect(result?.getAttribute('aria-live')).toBeNull()
  })

  it('approval-expired draws expired-override fact lines', async () => {
    await mount('approval-expired')
    const root = card()
    expect(within(root).getByText(APPROVAL_COPY.expired)).toBeInTheDocument()
    expect(
      within(root).getByText('Recorded decision: approve'),
    ).toBeInTheDocument()
    expect(
      within(root).getByText('Effective decision: reject'),
    ).toBeInTheDocument()
    expect(within(root).getByText('Delivery: sent')).toBeInTheDocument()
    expect(
      within(root).getByText('Observed execution: unknown'),
    ).toBeInTheDocument()
  })

  it('approval-answered-elsewhere draws monitor answer title and time', async () => {
    await mount('approval-answered-elsewhere')
    const root = card()
    expect(
      within(root).getByText(`${APPROVAL_COPY.byMonitor} · approve`),
    ).toBeInTheDocument()
    expect(within(root).getByText('Oct 14, 2026, 5:46 PM')).toBeInTheDocument()
    expect(
      within(root).getByText(APPROVAL_COPY.alreadyAnswered),
    ).toBeInTheDocument()
  })

  it('approval-refused draws settled copy only', async () => {
    await mount('approval-refused')
    const root = card()
    expect(within(root).getByText(APPROVAL_COPY.settled)).toBeInTheDocument()
    expect(
      within(root).queryByRole('button', { name: APPROVAL_COPY.refresh }),
    ).toBeNull()
  })

  it('approval-uncertain draws delivery_unknown lines', async () => {
    await mount('approval-uncertain')
    const root = card()
    expect(within(root).getByText(APPROVAL_COPY.unknown)).toBeInTheDocument()
    expect(
      within(root).getByText('Delivery: delivery_unknown'),
    ).toBeInTheDocument()
    expect(
      within(root).getByText('Observed execution: unknown'),
    ).toBeInTheDocument()
  })

  it('stale Refresh restores the pending exact card', async () => {
    const user = userEvent.setup()
    await mount('approval-stale')
    await user.click(
      within(card()).getByRole('button', { name: APPROVAL_COPY.refresh }),
    )
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(
      within(card()).getByRole('button', { name: APPROVAL_COPY.approveOnce }),
    ).toBeEnabled()
  })

  it('moves focus to the card result after a respond refusal', async () => {
    const user = userEvent.setup()
    const app = await mount('approval-exact')
    app.mock.engine.respondTaskApproval = async () => ({
      kind: 'refused',
      refusal: { reason: 'not_current' },
    })
    await user.click(
      within(card()).getByRole('button', { name: APPROVAL_COPY.approveOnce }),
    )
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(document.activeElement).toBe(
      card().querySelector('.hd-approval__result'),
    )
  })
})
