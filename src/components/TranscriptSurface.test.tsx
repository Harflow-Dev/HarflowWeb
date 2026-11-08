import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TRANSCRIPT_REQUEST_TEXT,
  type TranscriptObservation,
} from '../model'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { TaskEventsPane } from './TaskEventsPane'
import { TranscriptSurface } from './TranscriptSurface'
import { useState } from 'react'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function Harness({
  initial,
  eventsOpen = false,
}: {
  readonly initial: TranscriptObservation
  readonly eventsOpen?: boolean
}) {
  const [transcript, setTranscript] = useState(initial)
  const [note, setNote] = useState('')
  return (
    <div className="hd-split">
      <div>
        <TranscriptSurface
          transcript={transcript}
          onTranscriptChange={setTranscript}
          onAnnounce={setNote}
        />
        <div data-testid="announce">{note}</div>
      </div>
      {eventsOpen ? (
        <TaskEventsPane
          transcript={transcript}
          executionStatus="Done"
          onUnavailable={setNote}
          onCopyRecord={async () => {
            const el = document.querySelector('[data-record]')
            if (!(el instanceof HTMLElement) || !el.textContent) {
              setNote('Nothing to copy in this view.')
              return
            }
            try {
              if (!navigator.clipboard?.writeText) throw new Error('unavailable')
              await navigator.clipboard.writeText(el.textContent)
              setTranscript((prev) => ({
                ...prev,
                liveMessage: 'Copied normalized mock record.',
              }))
              setNote('Copied normalized mock record.')
            } catch {
              setNote(
                'Text selected. Use your system copy command to copy it.',
              )
            }
          }}
        />
      ) : null}
    </div>
  )
}

describe('TranscriptSurface states', () => {
  it('observed: original request disclosure and activity boundary', () => {
    render(<Harness initial={transcriptObservationFor('observed')} />)
    expect(screen.getByText('Original request')).toBeInTheDocument()
    expect(screen.getByText(TRANSCRIPT_REQUEST_TEXT)).toBeInTheDocument()
    expect(
      screen.getByText('Verified stored request · complete'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Captured activity caught up'),
    ).toBeInTheDocument()
  })

  it('loading: skeletons and no zero totals or request text', () => {
    render(<Harness initial={transcriptObservationFor('loading')} />)
    expect(screen.getByLabelText('Loading request')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading history')).toBeInTheDocument()
    expect(screen.queryByText(TRANSCRIPT_REQUEST_TEXT)).toBeNull()
    expect(document.body.textContent).not.toMatch(/0 tool calls/)
  })

  it('partial: truncated request and capture-gap qualification', () => {
    render(<Harness initial={transcriptObservationFor('partial')} />)
    expect(screen.getByText('Partial request')).toBeInTheDocument()
    expect(screen.getByText('Bounded prefix · truncated')).toBeInTheDocument()
    expect(
      screen.getByText('History incomplete · capture gap'),
    ).toBeInTheDocument()
    const pre = screen.getByText((_c, el) =>
      Boolean(el?.tagName === 'PRE' && el.getAttribute('data-copy-text') !== null),
    )
    expect(pre.textContent?.length).toBe(64)
  })

  it('unavailable: request refusal without inventing assignment text', () => {
    render(<Harness initial={transcriptObservationFor('unavailable')} />)
    expect(screen.getByText('Original request unavailable')).toBeInTheDocument()
    expect(
      screen.getByText('The original request could not be read.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(TRANSCRIPT_REQUEST_TEXT)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Retry request read' }),
    ).toBeInTheDocument()
  })

  it('integrity-failed: withheld text is absent from the DOM', () => {
    const { container } = render(
      <Harness initial={transcriptObservationFor('integrity-failed')} />,
    )
    expect(
      screen.getByText('Original request · integrity check failed'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Content withheld because integrity verification failed.',
      ),
    ).toBeInTheDocument()
    expect(container.textContent).not.toContain('slot release race')
    expect(container.querySelector('[data-copy-text]')).toBeNull()
  })

  it('reconnecting: keeps rows until explicit Load current activity', async () => {
    const user = userEvent.setup()
    render(<Harness initial={transcriptObservationFor('reconnecting')} />)
    expect(
      screen.getByText('Reconnecting · cached history is not current'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Retry history read' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Load current activity' }),
    )
    expect(
      screen.getByText('Current activity window'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/I found the notification outside the lock/),
    ).toBeNull()
    expect(screen.getByTestId('announce').textContent).toContain(
      'Current activity window loaded by request',
    )
  })

  it('capacity: keeps rows and offers explicit rebase', () => {
    render(<Harness initial={transcriptObservationFor('capacity')} />)
    expect(
      screen.getByText(
        'This view reached its limit. Your reading position is kept.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeInTheDocument()
  })

  it('sources: rows remain and Events can show stubs when opened', () => {
    render(
      <Harness
        initial={transcriptObservationFor('events')}
        eventsOpen
      />,
    )
    expect(
      screen.getByText(
        'History incomplete · unsupported record retained in Events',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Unsupported record · public stub'),
    ).toBeInTheDocument()
    expect(screen.getByText('Record ordering')).toBeInTheDocument()
    expect(screen.getByText('Recovered message')).toBeInTheDocument()
  })
})

describe('TranscriptSurface Events pane', () => {
  it('opens Events content with disabled Changes and Artifacts explanations', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initial={transcriptObservationFor('observed')}
        eventsOpen
      />,
    )
    expect(screen.getByText('Captured activity facts')).toBeInTheDocument()
    expect(screen.getByText(/2 tool calls observed/)).toBeInTheDocument()
    expect(
      screen.getByText(/Status: Done · independent of captured activity/),
    ).toBeInTheDocument()
    const changes = screen.getByRole('tab', { name: 'Changes' })
    const artifacts = screen.getByRole('tab', { name: 'Artifacts' })
    expect(changes).toHaveAttribute('aria-disabled', 'true')
    expect(artifacts).toHaveAttribute('aria-disabled', 'true')
    await user.click(changes)
    expect(screen.getByTestId('announce').textContent).toContain(
      'No changes data',
    )
    await user.click(artifacts)
    expect(screen.getByTestId('announce').textContent).toContain(
      'No artifacts data',
    )
  })

  it('Copy record succeeds with a mocked clipboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    })
    render(
      <Harness
        initial={transcriptObservationFor('observed')}
        eventsOpen
      />,
    )
    const disclosure = screen.getByText('Tool result · normalized record')
      .closest('details')
    expect(disclosure).not.toBeNull()
    if (disclosure && !disclosure.open) {
      disclosure.open = true
    }
    await user.click(
      screen.getByRole('button', { name: 'Copy normalized record' }),
    )
    expect(writeText).toHaveBeenCalled()
    const expected = screen.getByText((_c, el) =>
      Boolean(el?.tagName === 'PRE' && el.hasAttribute('data-record')),
    ).textContent
    expect(writeText).toHaveBeenCalledWith(expected)
    expect(screen.getByTestId('announce').textContent).toContain(
      'Copied normalized mock record.',
    )
  })

  it('Copy record reports failure when clipboard is unavailable', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: undefined,
    })
    render(
      <Harness
        initial={transcriptObservationFor('observed')}
        eventsOpen
      />,
    )
    const disclosure = screen
      .getByText('Tool result · normalized record')
      .closest('details')
    if (disclosure) disclosure.open = true
    await user.click(
      screen.getByRole('button', { name: 'Copy normalized record' }),
    )
    expect(screen.getByTestId('announce').textContent).toContain(
      'Text selected. Use your system copy command to copy it.',
    )
  })

  it('live region announces history actions', async () => {
    const user = userEvent.setup()
    render(<Harness initial={transcriptObservationFor('observed')} />)
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    const live = document.querySelector('[data-d2b-live]')
    expect(live?.textContent).toContain('Earlier captured rows loaded')
    expect(live).toHaveAttribute('aria-live', 'polite')
  })

  it('keyboard reaches disclosures and Copy record', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    })
    render(
      <Harness
        initial={transcriptObservationFor('observed')}
        eventsOpen
      />,
    )
    await user.tab()
    // Walk focus until Copy normalized record is focused.
    let guard = 0
    while (
      document.activeElement?.getAttribute('data-action') !== 'copy-record' &&
      guard < 40
    ) {
      await user.tab()
      guard += 1
    }
    expect(document.activeElement).toHaveAttribute(
      'data-action',
      'copy-record',
    )
    await user.keyboard('{Enter}')
    expect(writeText).toHaveBeenCalled()
  })
})

describe('TranscriptSurface details semantics', () => {
  it('uses native details for the original request disclosure', () => {
    render(<Harness initial={transcriptObservationFor('observed')} />)
    const details = screen.getByText('Original request').closest('details')
    expect(details).not.toBeNull()
    expect(within(details as HTMLElement).getByText(TRANSCRIPT_REQUEST_TEXT)).toBeInTheDocument()
  })
})
