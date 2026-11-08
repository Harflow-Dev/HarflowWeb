import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import {
  asTaskId,
  TRANSCRIPT_REQUEST_TEXT,
  type TaskObservation,
  type TranscriptObservation,
  type TranscriptRow,
} from '../model'
import { transcriptObservationFor } from '../adapters/mock/transcriptFixtures'
import { TaskPage } from './TaskPage'
import { TranscriptSurface } from './TranscriptSurface'
import {
  captureVisibleAnchor,
  restoreVisibleAnchor,
  applyFocusAfterAction,
  focusTargetFor,
} from './transcriptScroll'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function ReadingHarness({
  initial,
}: {
  readonly initial: TranscriptObservation
}) {
  const [transcript, setTranscript] = useState(initial)
  const [note, setNote] = useState('')
  return (
    <div>
      <TranscriptSurface
        transcript={transcript}
        onReadingChange={setTranscript}
        onAnnounce={setNote}
      />
      <div data-testid="announce">{note}</div>
    </div>
  )
}

function ObservationHarness({
  sequence,
}: {
  readonly sequence: readonly TranscriptObservation[]
}) {
  const [index, setIndex] = useState(0)
  const observation: TaskObservation = {
    status: 'completed',
    taskId: asTaskId('task-obs'),
    title: 'Fix slot release test',
    statusBadge: 'Done',
    headerMeta: 'Codex · HarflowMCP',
    followUpPlaceholder: 'Continue this task',
    transcript: sequence[index]!,
    detailsPane: 'events',
    summary: {
      heading: 'Summary',
      segments: [{ kind: 'paragraph', runs: [{ kind: 'text', value: 'ok' }] }],
    },
  }
  return (
    <div>
      <TaskPage
        observation={observation}
        eventsPaneOpen
        onUnavailable={() => undefined}
      />
      <button
        type="button"
        data-testid="next-obs"
        onClick={() =>
          setIndex((value) => Math.min(value + 1, sequence.length - 1))
        }
      >
        Next observation
      </button>
    </div>
  )
}

describe('TranscriptSurface observation reconciliation', () => {
  it('removes withheld request text when observation becomes integrity-failed', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('observed'),
          transcriptObservationFor('integrity-failed'),
        ]}
      />,
    )
    expect(screen.getByText(TRANSCRIPT_REQUEST_TEXT)).toBeInTheDocument()
    await user.click(screen.getByTestId('next-obs'))
    expect(screen.queryByText(TRANSCRIPT_REQUEST_TEXT)).toBeNull()
    expect(document.querySelector('[data-copy-text]')).toBeNull()
    expect(
      screen.getByText(
        'Content withheld because integrity verification failed.',
      ),
    ).toBeInTheDocument()
  })

  it('shows totals when observation moves from loading to observed', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('loading'),
          transcriptObservationFor('observed'),
        ]}
      />,
    )
    expect(screen.getByLabelText('Loading history')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/0 tool calls/)
    await user.click(screen.getByTestId('next-obs'))
    expect(screen.getByText('2 tool calls observed')).toBeInTheDocument()
  })

  it('keeps rows across reconnecting then observed', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('observed'),
          transcriptObservationFor('reconnecting'),
          transcriptObservationFor('observed'),
        ]}
      />,
    )
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeInTheDocument()
    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
  })

  it('keeps old rows on source change until explicit Load current activity', async () => {
    const user = userEvent.setup()
    render(
      <ReadingHarness initial={transcriptObservationFor('reconnecting')} />,
    )
    expect(
      screen.getByText(/I found the notification outside the lock/),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Load current activity' }),
    )
    expect(
      screen.queryByText(/I found the notification outside the lock/),
    ).toBeNull()
    expect(screen.getByText('Current activity window')).toBeInTheDocument()
  })
})

describe('TranscriptRows observation payloads', () => {
  it('renders empty, reordered, and replaced row payloads', () => {
    const empty = transcriptObservationFor('observed')
    const { rerender } = render(
      <TranscriptSurface
        transcript={{ ...empty, rows: [] }}
        onReadingChange={() => undefined}
        onAnnounce={() => undefined}
      />,
    )
    expect(document.querySelectorAll('[data-row]')).toHaveLength(0)

    const reordered: TranscriptRow[] = [
      empty.rows[2]!,
      empty.rows[0]!,
      empty.rows[1]!,
    ]
    rerender(
      <TranscriptSurface
        transcript={{ ...empty, rows: reordered }}
        onReadingChange={() => undefined}
        onAnnounce={() => undefined}
      />,
    )
    const ids = [...document.querySelectorAll('[data-row]')].map(
      (el) => (el as HTMLElement).dataset.row,
    )
    expect(ids).toEqual(['validation-summary', 'anchor', 'tool'])

    const replaced: TranscriptRow[] = [
      {
        id: 'only',
        sourceEpoch: 'b',
        windowEpoch: 1,
        occurrence: 0,
        seq: 1,
        type: 'message',
        anchorId: 'only',
        title: 'Replaced',
        body: 'Only this row remains.',
      },
    ]
    rerender(
      <TranscriptSurface
        transcript={{ ...empty, rows: replaced }}
        onReadingChange={() => undefined}
        onAnnounce={() => undefined}
      />,
    )
    expect(screen.getByText('Only this row remains.')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-row]')).toHaveLength(1)
  })
})

describe('TaskPage Copy record (production path)', () => {
  function page(obs: TranscriptObservation) {
    const observation: TaskObservation = {
      status: 'completed',
      taskId: asTaskId('task-copy'),
      title: 'Fix slot release test',
      statusBadge: 'Done',
      headerMeta: 'Codex · HarflowMCP',
      followUpPlaceholder: 'Continue',
      transcript: obs,
      detailsPane: 'events',
      summary: {
        heading: 'Summary',
        segments: [{ kind: 'paragraph', runs: [{ kind: 'text', value: 'ok' }] }],
      },
    }
    return (
      <TaskPage
        observation={observation}
        eventsPaneOpen
        onUnavailable={() => undefined}
      />
    )
  }

  it('announces success only after writeText resolves', async () => {
    const user = userEvent.setup()
    let resolveWrite: (() => void) | undefined
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve
        }),
    )
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    })
    render(page(transcriptObservationFor('observed')))
    const disclosure = screen
      .getByText('Tool result · normalized record')
      .closest('details')
    if (disclosure) disclosure.open = true
    await user.click(
      screen.getByRole('button', { name: 'Copy normalized record' }),
    )
    expect(writeText).toHaveBeenCalled()
    expect(screen.queryByText('Copied normalized mock record.')).toBeNull()
    resolveWrite?.()
    expect(
      await screen.findByText('Copied normalized mock record.'),
    ).toBeInTheDocument()
  })

  it('reports failure when clipboard rejects', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    })
    render(page(transcriptObservationFor('observed')))
    const disclosure = screen
      .getByText('Tool result · normalized record')
      .closest('details')
    if (disclosure) disclosure.open = true
    await user.click(
      screen.getByRole('button', { name: 'Copy normalized record' }),
    )
    expect(
      await screen.findByText(
        'Text selected. Use your system copy command to copy it.',
      ),
    ).toBeInTheDocument()
  })

  it('reports failure when clipboard is unavailable', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: undefined,
    })
    render(page(transcriptObservationFor('observed')))
    const disclosure = screen
      .getByText('Tool result · normalized record')
      .closest('details')
    if (disclosure) disclosure.open = true
    await user.click(
      screen.getByRole('button', { name: 'Copy normalized record' }),
    )
    expect(
      await screen.findByText(
        'Text selected. Use your system copy command to copy it.',
      ),
    ).toBeInTheDocument()
  })
})

describe('transcript scroll anchor and focus', () => {
  it('restores the captured anchor offset after earlier', () => {
    const history = document.createElement('div')
    const row = document.createElement('article')
    row.dataset.row = 'anchor'
    history.appendChild(row)
    document.body.appendChild(history)

    const historyRect = { top: 100, bottom: 300, height: 200 }
    const rowRect = { top: 160, bottom: 200, height: 40 }
    history.getBoundingClientRect = () => historyRect as DOMRect
    row.getBoundingClientRect = () => rowRect as DOMRect
    Object.defineProperty(history, 'scrollTop', {
      writable: true,
      value: 40,
    })

    const anchor = captureVisibleAnchor(history)
    expect(anchor).toEqual({ id: 'anchor', offset: 60 })

    row.getBoundingClientRect = () =>
      ({ top: 220, bottom: 260, height: 40 }) as DOMRect
    restoreVisibleAnchor(history, anchor)
    // scrollTop + (220 - 100) - 60 = 40 + 120 - 60 = 100
    expect(history.scrollTop).toBe(100)
    history.remove()
  })

  it('moves focus to the boundary when the retry control disappears', () => {
    const host = document.createElement('div')
    const boundary = document.createElement('div')
    boundary.setAttribute('data-d2b-boundary', '')
    boundary.tabIndex = -1
    host.appendChild(boundary)
    document.body.appendChild(host)
    const focusSpy = vi.spyOn(boundary, 'focus')
    applyFocusAfterAction(host, null, focusTargetFor('retry'))
    expect(focusSpy).toHaveBeenCalled()
    host.remove()
  })
})

describe('TranscriptSurface states', () => {
  it('observed: original request disclosure and activity boundary', () => {
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
    expect(screen.getByText('Original request')).toBeInTheDocument()
    expect(screen.getByText(TRANSCRIPT_REQUEST_TEXT)).toBeInTheDocument()
    expect(
      screen.getByText('Captured activity caught up'),
    ).toBeInTheDocument()
  })

  it('uses native details for the original request disclosure', () => {
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
    const details = screen.getByText('Original request').closest('details')
    expect(details).not.toBeNull()
    expect(
      within(details as HTMLElement).getByText(TRANSCRIPT_REQUEST_TEXT),
    ).toBeInTheDocument()
  })
})
