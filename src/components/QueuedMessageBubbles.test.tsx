import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { QueuedMessagesTailView } from '../presentation/queuedMessages'
import { QueuedMessageBubbles } from './QueuedMessageBubbles'

afterEach(cleanup)

const TAIL: QueuedMessagesTailView = {
  messages: [],
  settled: [],
  pinned: [],
  outcome: 'Queued message cancelled.',
}

function outcome(): HTMLElement {
  return screen.getByText('Queued message cancelled.')
}

describe('QueuedMessageBubbles outcome focus', () => {
  it('does not take focus when it mounts with an earlier focus seq', () => {
    render(<QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={3} />)
    expect(outcome()).not.toHaveFocus()
  })

  it('does not take focus when remounted with the same seq', () => {
    const first = render(<QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={2} />)
    first.unmount()
    render(<QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={2} />)
    expect(outcome()).not.toHaveFocus()
  })

  it('takes focus once when the seq increases after mount', () => {
    const { rerender } = render(
      <QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={2} />,
    )
    rerender(<QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={3} />)
    expect(outcome()).toHaveFocus()
    outcome().blur()
    rerender(<QueuedMessageBubbles tail={TAIL} focusOutcomeSeq={3} />)
    expect(outcome()).not.toHaveFocus()
  })
})
