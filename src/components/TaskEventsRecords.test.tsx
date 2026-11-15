import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pageEventsObservation } from '../adapters/mock/taskEventsFixtures'
import { ASSISTANT_START } from '../adapters/mock/taskEventsRecordFixtures'
import {
  IDLE_EVENTS_EARLIER,
  type EventsEarlierState,
} from '../presentation/taskState'
import { TaskEventsRecords } from './TaskEventsRecords'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const ROW_HEIGHT = 40
const CHROME_ABOVE = 50

/** Fake layout: rows stack in DOM order below fixed chrome inside the scroller. */
function stubLayout(scroller: HTMLElement): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this === scroller) {
        return { top: 0, bottom: 400, height: 400 } as DOMRect
      }
      const rows = [...scroller.querySelectorAll('[data-row]')]
      const index = rows.indexOf(this)
      const top = CHROME_ABOVE + index * ROW_HEIGHT - scroller.scrollTop
      return { top, bottom: top + ROW_HEIGHT, height: ROW_HEIGHT } as DOMRect
    },
  )
}

function Harness({ answer }: { readonly answer: EventsEarlierState }) {
  const [earlier, setEarlier] = useState<EventsEarlierState>(IDLE_EVENTS_EARLIER)
  return (
    <div className="hd-m05-panescroll" data-testid="scroller">
      <TaskEventsRecords
        observation={pageEventsObservation()}
        earlier={earlier}
        onLoadEarlier={() => setEarlier(answer)}
        onUnavailable={() => undefined}
      />
    </div>
  )
}

describe('Events Load earlier reading position', () => {
  it('keeps the first visible record at its offset when older records are added', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        answer={{
          status: 'loaded',
          records: [ASSISTANT_START],
          hasOlder: false,
          olderCursor: null,
        }}
      />,
    )
    const scroller = screen.getByTestId('scroller')
    stubLayout(scroller)
    scroller.scrollTop = 20
    const anchorRow = () =>
      scroller.querySelector<HTMLElement>('[data-row="event-41"]')!
    const offsetBefore = anchorRow().getBoundingClientRect().top
    expect(offsetBefore).toBe(CHROME_ABOVE - 20)

    await user.click(screen.getByRole('button', { name: 'Load earlier' }))

    expect(scroller.querySelector('[data-row="event-40"]')).not.toBeNull()
    // The older record sits above, yet the anchor record has not moved.
    expect(anchorRow().getBoundingClientRect().top).toBe(offsetBefore)
    expect(scroller.scrollTop).toBe(20 + ROW_HEIGHT)
  })

  it('offers Load earlier again while older pages remain', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        answer={{
          status: 'loaded',
          records: [ASSISTANT_START],
          hasOlder: true,
          olderCursor: 'older:more',
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(screen.getByRole('button', { name: 'Load earlier' })).toBeInTheDocument()
    expect(screen.queryByText(/reached its beginning/)).toBeNull()
  })
})
