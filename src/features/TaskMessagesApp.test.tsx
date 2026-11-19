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
import {
  MSG_FIRST,
  MSG_SECOND,
} from '../adapters/mock/taskMessageFixtures'
import { applyNewTaskSeed, createApp, PreviewShell } from '../composition'
import { QUEUED_MESSAGE_COPY } from '../presentation'
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

function transcript(): HTMLElement {
  return document.querySelector('.hd-transcript') as HTMLElement
}

function composer(): HTMLElement {
  return screen.getByRole('form', { name: 'Follow-up' })
}

describe('Task screen queued message scenarios', () => {
  it('message-queued draws two Queued bubbles with Cancel and Send now', async () => {
    await mount('message-queued')
    const root = transcript()
    expect(within(root).getAllByText(QUEUED_MESSAGE_COPY.captionQueued)).toHaveLength(
      2,
    )
    expect(within(root).getByText(MSG_FIRST)).toBeInTheDocument()
    expect(within(root).getByText(MSG_SECOND)).toBeInTheDocument()
    expect(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    ).toBeEnabled()
    expect(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_SECOND}`,
      }),
    ).toBeEnabled()
    const sendNow = within(composer()).getByRole('button', {
      name: QUEUED_MESSAGE_COPY.sendNowLabel,
    })
    expect(sendNow).toBeDisabled()
    expect(sendNow).toHaveAttribute('title', QUEUED_MESSAGE_COPY.sendNowTitle)
    const working = root.querySelector('.hd-working')
    const firstBubble = root.querySelector('[data-message="a"]')
    expect(working).not.toBeNull()
    expect(firstBubble).not.toBeNull()
    expect(
      working!.compareDocumentPosition(firstBubble!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('message-delivering keeps Queued caption, hides Cancel, shows delivery outcome', async () => {
    await mount('message-delivering')
    const root = transcript()
    expect(within(root).getByText(QUEUED_MESSAGE_COPY.captionQueued)).toBeInTheDocument()
    expect(within(root).getByText(MSG_FIRST)).toBeInTheDocument()
    expect(
      within(root).queryByRole('button', { name: /Cancel queued message/ }),
    ).toBeNull()
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.deliveryInProgress),
    ).toBeInTheDocument()
  })

  it('message-delivered draws no bubble and shows Message delivered', async () => {
    await mount('message-delivered')
    const root = transcript()
    expect(root.querySelectorAll('.hd-msgq')).toHaveLength(0)
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.messageDelivered),
    ).toBeInTheDocument()
  })

  it('message-cancelled keeps the second queued bubble and cancelled outcome', async () => {
    await mount('message-cancelled')
    const root = transcript()
    expect(within(root).getByText(MSG_SECOND)).toBeInTheDocument()
    expect(within(root).queryByText(MSG_FIRST)).toBeNull()
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).toBeInTheDocument()
  })

  it('message-send-now-refused keeps Cancel and shows the refusal note', async () => {
    await mount('message-send-now-refused')
    const root = transcript()
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.sendNowRefusedNote),
    ).toBeInTheDocument()
    expect(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    ).toBeEnabled()
  })

  it('message-uncertain sits above the working row without Cancel', async () => {
    await mount('message-uncertain')
    const root = transcript()
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.captionUncertain),
    ).toBeInTheDocument()
    expect(
      within(root).getByText(QUEUED_MESSAGE_COPY.uncertainNote),
    ).toBeInTheDocument()
    expect(
      within(root).queryByRole('button', { name: /Cancel queued message/ }),
    ).toBeNull()
    const working = root.querySelector('.hd-working')
    const bubble = root.querySelector('[data-message="a"]')
    expect(working).not.toBeNull()
    expect(bubble).not.toBeNull()
    expect(
      bubble!.compareDocumentPosition(working!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('message-unsupported locks the composer without hint, placeholder, or Send now', async () => {
    await mount('message-unsupported')
    const form = composer()
    const input = within(form).getByLabelText('Message this task')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', '')
    expect(within(form).queryByText(/Send queues/)).toBeNull()
    expect(
      within(form).queryByRole('button', { name: QUEUED_MESSAGE_COPY.sendNowLabel }),
    ).toBeNull()
    expect(within(form).getByRole('button', { name: /Send follow-up/ })).toBeDisabled()
  })

  it('message-queued-settled draws two Cancel bubbles with a standard composer', async () => {
    await mount('message-queued-settled')
    const root = transcript()
    expect(within(root).getByText(MSG_FIRST)).toBeInTheDocument()
    expect(within(root).getByText(MSG_SECOND)).toBeInTheDocument()
    expect(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    ).toBeEnabled()
    const form = composer()
    expect(
      within(form).queryByRole('button', { name: QUEUED_MESSAGE_COPY.sendNowLabel }),
    ).toBeNull()
    expect(within(form).getByLabelText('Message this task')).not.toBeDisabled()
    expect(within(form).getByText(/Send queues/)).toBeInTheDocument()
  })

  it('Cancel removes the message, focuses the outcome, and announces through StatusRegion', async () => {
    const user = userEvent.setup()
    await mount('message-queued')
    const root = transcript()
    await user.click(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    )
    expect(within(root).queryByText(MSG_FIRST)).toBeNull()
    expect(within(root).getByText(MSG_SECOND)).toBeInTheDocument()
    const outcome = within(root).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome)
    expect(outcome).toHaveFocus()
    expect(screen.getByRole('status').textContent).toContain(
      QUEUED_MESSAGE_COPY.cancelledOutcome,
    )
  })

  it('Cancel on a finished task focuses the outcome after the failure banner', async () => {
    const user = userEvent.setup()
    await mount('message-queued-settled')
    const root = transcript()
    await user.click(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_SECOND}`,
      }),
    )
    const outcome = within(root).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome)
    expect(outcome).toHaveFocus()
    const banner = root.querySelector('.hd-banner')
    expect(banner).not.toBeNull()
    expect(
      banner!.compareDocumentPosition(outcome) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(within(root).getByText(MSG_FIRST)).toBeInTheDocument()
    expect(within(root).queryByText(MSG_SECOND)).toBeNull()
  })

  it('does not move focus to the outcome when the task is reopened', async () => {
    const user = userEvent.setup()
    const app = await mount('message-queued')
    const root = transcript()
    await user.click(
      within(root).getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    )
    expect(
      within(transcript()).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).toHaveFocus()
    ;(document.activeElement as HTMLElement).blur()
    await act(async () => {
      app.presenter.openTask(app.presenter.getState().task.selectedTaskId!)
      await Promise.resolve()
    })
    expect(
      within(transcript()).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).not.toHaveFocus()
  })

  it('boots message-queued through the preview seeding path', async () => {
    window.location.hash = '#message-queued'
    render(<PreviewShell />)
    expect(await screen.findByText(MSG_FIRST)).toBeInTheDocument()
    expect(screen.getByText(MSG_SECOND)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: `Cancel queued message: ${MSG_FIRST}`,
      }),
    ).toBeEnabled()
  })
})
