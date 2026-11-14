import {
  act,
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import {
  MESSAGE_CANCELLED_PARALLEL_GROUP_ID,
  MESSAGES_QUEUED_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { applyNewTaskSeed, createApp, PreviewShell } from '../composition'
import {
  QUEUED_MESSAGE_COPY,
  QUEUED_MESSAGE_FIRST,
  QUEUED_MESSAGE_SECOND,
} from '../presentation/parallelGroupQueuedMessages'
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

function runningLane() {
  return screen.getByRole('region', { name: 'Parallel group lanes' })
    .querySelectorAll('section.hd-lane')[0] as HTMLElement
}

describe('Parallel group queued message scenarios', () => {
  it('renders two Queued messages with message-specific unavailable Cancel controls', async () => {
    await mount('parallel-group-lane-messages-queued')
    const lane = runningLane()
    expect(within(lane).getAllByText(QUEUED_MESSAGE_COPY.captionQueued)).toHaveLength(
      2,
    )
    expect(within(lane).getByText(QUEUED_MESSAGE_FIRST)).toBeInTheDocument()
    expect(within(lane).getByText(QUEUED_MESSAGE_SECOND)).toBeInTheDocument()
    const firstCancel = within(lane).getByRole('button', {
      name: `Cancel queued message: ${QUEUED_MESSAGE_FIRST}`,
    })
    const secondCancel = within(lane).getByRole('button', {
      name: `Cancel queued message: ${QUEUED_MESSAGE_SECOND}`,
    })
    expect(firstCancel).toBeDisabled()
    expect(firstCancel).toHaveAccessibleDescription(
      QUEUED_MESSAGE_COPY.cancelUnavailable,
    )
    expect(secondCancel).toBeDisabled()
    expect(screen.queryByText(QUEUED_MESSAGE_COPY.deliveryInProgress)).toBeNull()
    const lanes = screen.getAllByRole('region', { name: /Done|Running/i })
    void lanes
    const doneLanes = [
      ...screen
        .getByRole('region', { name: 'Parallel group lanes' })
        .querySelectorAll('section.hd-lane'),
    ].slice(1)
    for (const done of doneLanes) {
      expect(within(done as HTMLElement).queryByText('Queued')).toBeNull()
    }
  })

  it('renders delivering without Cancel and with the delivery outcome line', async () => {
    await mount('parallel-group-lane-message-delivering')
    const lane = runningLane()
    expect(within(lane).getByText(QUEUED_MESSAGE_COPY.captionQueued)).toBeInTheDocument()
    expect(within(lane).getByText(QUEUED_MESSAGE_FIRST)).toBeInTheDocument()
    expect(
      within(lane).queryByRole('button', { name: /Cancel queued message/ }),
    ).toBeNull()
    expect(
      within(lane).getByText(QUEUED_MESSAGE_COPY.deliveryInProgress),
    ).toBeInTheDocument()
  })

  it('renders uncertain without Cancel and with the uncertain note', async () => {
    await mount('parallel-group-lane-message-uncertain')
    const lane = runningLane()
    expect(
      within(lane).getByText(QUEUED_MESSAGE_COPY.captionUncertain),
    ).toBeInTheDocument()
    expect(
      within(lane).getByText(QUEUED_MESSAGE_COPY.uncertainNote),
    ).toBeInTheDocument()
    expect(
      within(lane).queryByRole('button', { name: /Cancel queued message/ }),
    ).toBeNull()
  })

  it('seeds the cancelled outcome through composition and resets it on reopen', async () => {
    const app = await mount('parallel-group-lane-message-cancelled')
    const lane = runningLane()
    expect(within(lane).getByText(QUEUED_MESSAGE_SECOND)).toBeInTheDocument()
    expect(
      within(lane).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).toBeInTheDocument()
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toBe(
      QUEUED_MESSAGE_COPY.cancelledOutcome,
    )
    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toBeNull()
    await act(async () =>
      app.presenter.openParallelGroup(MESSAGE_CANCELLED_PARALLEL_GROUP_ID),
    )
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toBeNull()
    expect(screen.queryByText(QUEUED_MESSAGE_COPY.cancelledOutcome)).toBeNull()
  })

  it('boots the messages-queued preview scenario through the seeding path', async () => {
    window.location.hash = '#parallel-group-lane-messages-queued'
    render(<PreviewShell />)
    expect(
      await screen.findByText(QUEUED_MESSAGE_FIRST),
    ).toBeInTheDocument()
    expect(screen.getByText(QUEUED_MESSAGE_SECOND)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: `Cancel queued message: ${QUEUED_MESSAGE_FIRST}`,
      }),
    ).toBeDisabled()
  })

  it('keeps the queue only in the running lane for the messages-queued group id', async () => {
    const app = await mount('parallel-group-lane-messages-queued')
    expect(app.presenter.getState().parallelGroup.groupId).toBe(
      MESSAGES_QUEUED_PARALLEL_GROUP_ID,
    )
    const sections = [
      ...screen
        .getByRole('region', { name: 'Parallel group lanes' })
        .querySelectorAll('section.hd-lane'),
    ]
    expect(within(sections[0] as HTMLElement).getByText(QUEUED_MESSAGE_FIRST)).toBeInTheDocument()
    expect(within(sections[1] as HTMLElement).queryByText(QUEUED_MESSAGE_FIRST)).toBeNull()
    expect(within(sections[2] as HTMLElement).queryByText(QUEUED_MESSAGE_FIRST)).toBeNull()
  })
})
