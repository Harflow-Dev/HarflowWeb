import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MSG_FIRST,
  MSG_SECOND,
  messageQueuedSettledObservation,
} from '../adapters/mock/taskMessageFixtures'
import type { TaskMessage } from '../model'
import {
  EMPTY_TASK_MESSAGING,
  taskStatusView,
} from '../presentation'
import { TaskConversationColumn } from './TaskConversationColumn'

afterEach(cleanup)

function bubbleOrder(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-message]')].map(
    (node) => node.getAttribute('data-message') ?? '',
  )
}

describe('TaskConversationColumn on a task with no working row', () => {
  it('draws settled bubbles before pinned ones, then the outcome after the banner', () => {
    const messages: readonly TaskMessage[] = [
      { id: 'p', seq: 1, status: 'queued', delivery: 'queue', text: MSG_FIRST },
      {
        id: 's',
        seq: 2,
        status: 'delivering',
        delivery: 'queue',
        text: MSG_SECOND,
        reason: 'uncertain',
      },
    ]
    const observation = { ...messageQueuedSettledObservation(), messages }
    const { container } = render(
      <TaskConversationColumn
        observation={observation}
        view={taskStatusView(observation)}
        messagingChrome={{ ...EMPTY_TASK_MESSAGING, outcome: 'cancelled' }}
        onUnavailable={vi.fn()}
        onCancelQueuedMessage={vi.fn()}
      />,
    )
    const root = container as HTMLElement
    expect(bubbleOrder(root)).toEqual(['s', 'p'])
    const banner = root.querySelector('.hd-banner')
    const outcome = root.querySelector('.hd-msgq__outcome')
    expect(banner).not.toBeNull()
    expect(outcome).not.toBeNull()
    expect(
      banner!.compareDocumentPosition(outcome!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    const pinned = root.querySelector('[data-message="p"]')
    expect(
      banner!.compareDocumentPosition(pinned!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
