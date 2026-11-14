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
  QUEUE_FIRST as QUEUED_MESSAGE_FIRST,
  QUEUE_SECOND as QUEUED_MESSAGE_SECOND,
  TITLED_RUNNING_LANE_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { applyNewTaskSeed, createApp, PreviewShell } from '../composition'
import { PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION } from '../components/parallelGroupUnavailable'
import { QUEUED_MESSAGE_COPY } from '../presentation/parallelGroupQueuedMessages'
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

const CANCEL_EXPLANATION_SELECTOR = '#parallel-group-queued-cancel-unavailable'

function allLanes(): HTMLElement[] {
  return [
    ...screen
      .getByRole('region', { name: 'Parallel group lanes' })
      .querySelectorAll<HTMLElement>('section.hd-lane'),
  ]
}

function expectUniqueElementIds() {
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
}

function runningLane() {
  return allLanes()[0]!
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
      PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION,
    )
    expect(secondCancel).toBeDisabled()
    expect(screen.queryByText(QUEUED_MESSAGE_COPY.deliveryInProgress)).toBeNull()
    for (const done of allLanes().slice(1)) {
      expect(within(done).queryByText('Queued')).toBeNull()
    }
    expect(document.querySelectorAll(CANCEL_EXPLANATION_SELECTOR)).toHaveLength(1)
    expect(
      document.querySelector(CANCEL_EXPLANATION_SELECTOR)?.textContent,
    ).toBe(PARALLEL_GROUP_QUEUED_CANCEL_EXPLANATION)
    expectUniqueElementIds()
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
    expect(document.querySelectorAll(CANCEL_EXPLANATION_SELECTOR)).toHaveLength(0)
    expectUniqueElementIds()
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
    expect(document.querySelectorAll(CANCEL_EXPLANATION_SELECTOR)).toHaveLength(0)
    expectUniqueElementIds()
  })

  it('seeds the cancelled outcome through composition and resets it on reopen', async () => {
    const app = await mount('parallel-group-lane-message-cancelled')
    const lane = runningLane()
    expect(within(lane).getByText(QUEUED_MESSAGE_SECOND)).toBeInTheDocument()
    expect(
      within(lane).getByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).toBeInTheDocument()
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toEqual({
      laneId: TITLED_RUNNING_LANE_ID,
      kind: 'cancelled',
    })
    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toBeNull()
    await act(async () =>
      app.presenter.openParallelGroup(MESSAGE_CANCELLED_PARALLEL_GROUP_ID),
    )
    expect(app.presenter.getState().parallelGroup.queuedCancelOutcome).toBeNull()
    expect(screen.queryByText(QUEUED_MESSAGE_COPY.cancelledOutcome)).toBeNull()
  })

  it('shows the cancelled outcome once, only in the running lane', async () => {
    await mount('parallel-group-lane-message-cancelled')
    expect(screen.getAllByText(QUEUED_MESSAGE_COPY.cancelledOutcome)).toHaveLength(1)
    const [running, ...done] = allLanes()
    expect(
      within(running!).getAllByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
    ).toHaveLength(1)
    expect(done).toHaveLength(2)
    for (const lane of done) {
      expect(
        within(lane).queryByText(QUEUED_MESSAGE_COPY.cancelledOutcome),
      ).toBeNull()
    }
    expect(document.querySelectorAll(CANCEL_EXPLANATION_SELECTOR)).toHaveLength(1)
    expectUniqueElementIds()
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
    const sections = allLanes()
    expect(within(sections[0]!).getByText(QUEUED_MESSAGE_FIRST)).toBeInTheDocument()
    expect(within(sections[1]!).queryByText(QUEUED_MESSAGE_FIRST)).toBeNull()
    expect(within(sections[2]!).queryByText(QUEUED_MESSAGE_FIRST)).toBeNull()
  })
})
