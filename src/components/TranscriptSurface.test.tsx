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
import {
  eventsReaderFailedTranscript,
  preloadTranscript,
  retryBudgetDoneTranscript,
  slotReleaseTranscript,
} from '../adapters/mock/mappedTaskTranscripts'
import { EARLIER_UNAVAILABLE_EXPLANATION } from './TranscriptEarlierAction'
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
  withSummary = false,
}: {
  readonly sequence: readonly TranscriptObservation[]
  readonly withSummary?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [note, setNote] = useState('')
  const observation: TaskObservation = {
    status: 'completed',
    taskId: asTaskId('task-obs'),
    title: 'Fix slot release test',
    statusBadge: 'Done',
    headerMeta: 'Codex · HarflowMCP',
    followUpPlaceholder: 'Continue this task',
    transcript: sequence[index]!,
    detailsPane: 'events',
    ...(withSummary
      ? {
          summary: {
            heading: 'Summary',
            segments: [
              {
                kind: 'paragraph' as const,
                runs: [{ kind: 'text' as const, value: 'Completed summary.' }],
              },
            ],
          },
        }
      : {}),
  }
  return (
    <div>
      <TaskPage
        observation={observation}
        eventsPaneOpen
        onUnavailable={setNote}
      />
      <div data-testid="unavailable">{note}</div>
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

function stubHistoryGeometry(
  history: HTMLElement,
  row: HTMLElement,
  historyTop: number,
  rowTop: number,
  scrollTop = 40,
): void {
  history.getBoundingClientRect = () =>
    ({ top: historyTop, bottom: historyTop + 200, height: 200 }) as DOMRect
  row.getBoundingClientRect = () =>
    ({ top: rowTop, bottom: rowTop + 40, height: 40 }) as DOMRect
  Object.defineProperty(history, 'scrollTop', {
    configurable: true,
    writable: true,
    value: scrollTop,
  })
  Object.defineProperty(history, 'scrollHeight', {
    configurable: true,
    value: 800,
  })
}

/**
 * After Load earlier inserts a row, the retained anchor is pushed down by
 * `pushPx`. Restore must compensate so the visible offset stays the same.
 */
function stubAnchorPushAfterEarlier(
  history: HTMLElement,
  anchor: HTMLElement,
  historyTop: number,
  initialRowTop: number,
  pushPx: number,
  scrollTop = 40,
): void {
  stubHistoryGeometry(history, anchor, historyTop, initialRowTop, scrollTop)
  anchor.getBoundingClientRect = () => {
    const pushed = history.querySelector('[data-row="earlier"]') !== null
    const top = pushed ? initialRowTop + pushPx : initialRowTop
    return { top, bottom: top + 40, height: 40 } as DOMRect
  }
}

/**
 * After Retry, the boundary grows (Retry swaps for Load earlier). The
 * retained anchor shifts down by `pushPx` until restore compensates.
 */
function stubAnchorPushAfterRetry(
  history: HTMLElement,
  anchor: HTMLElement,
  historyTop: number,
  initialRowTop: number,
  pushPx: number,
  scrollTop = 40,
): void {
  stubHistoryGeometry(history, anchor, historyTop, initialRowTop, scrollTop)
  anchor.getBoundingClientRect = () => {
    const retryGone = history.querySelector('[data-action="retry"]') === null
    const top = retryGone ? initialRowTop + pushPx : initialRowTop
    return { top, bottom: top + 40, height: 40 } as DOMRect
  }
}

describe('TranscriptSurface observation reconciliation', () => {
  it('keeps earlier rows through reconnect, totals update, and integrity failure', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('observed'),
          transcriptObservationFor('reconnecting'),
          {
            ...transcriptObservationFor('observed'),
            summaryCoverage: 'unavailable',
          },
          transcriptObservationFor('integrity-failed'),
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()

    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Reconnecting · cached history is not current'),
    ).toBeInTheDocument()

    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tool activity unavailable')).toBeInTheDocument()

    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(TRANSCRIPT_REQUEST_TEXT)).toBeNull()
    expect(document.querySelector('[data-copy-text]')).toBeNull()
    expect(
      screen.getByText(
        'Content withheld because integrity verification failed.',
      ),
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

  it('rebrings Load current activity after rebase when a later pending source differs', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('reconnecting'),
          {
            ...transcriptObservationFor('reconnecting'),
            pendingSourceEpoch: 'mock-source-c',
          },
        ]}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Load current activity' }),
    )
    expect(
      screen.queryByRole('button', { name: 'Load current activity' }),
    ).toBeNull()
    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Current activity window')).toBeInTheDocument()
  })

  it('does not rebring Load current activity when the later pending source matches', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[
          transcriptObservationFor('reconnecting'),
          {
            ...transcriptObservationFor('reconnecting'),
            // Same pending as the adopted source after rebase (mock-source-b).
            pendingSourceEpoch: 'mock-source-b',
          },
        ]}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Load current activity' }),
    )
    await user.click(screen.getByTestId('next-obs'))
    expect(
      screen.queryByRole('button', { name: 'Load current activity' }),
    ).toBeNull()
  })
})

describe('task-owned earlier prototypes', () => {
  it('Load earlier shows different content for two tasks', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <ReadingHarness initial={slotReleaseTranscript()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()
    unmount()

    render(<ReadingHarness initial={preloadTranscript()} />)
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(
      screen.getByText('Read preload bridge notes from the prior turn.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Read slot release implementation.'),
    ).toBeNull()
  })

  it('Load earlier on each offering fixture only shows that fixture’s rows', async () => {
    const user = userEvent.setup()
    const fixtures: ReadonlyArray<{
      readonly label: string
      readonly transcript: TranscriptObservation
      readonly ownedEarlier: string
      readonly foreignEarlier: readonly string[]
    }> = [
      {
        label: 'slot-release',
        transcript: slotReleaseTranscript(),
        ownedEarlier: 'Read slot release implementation.',
        foreignEarlier: [
          'Read preload bridge notes from the prior turn.',
        ],
      },
      {
        label: 'preload',
        transcript: preloadTranscript(),
        ownedEarlier: 'Read preload bridge notes from the prior turn.',
        foreignEarlier: ['Read slot release implementation.'],
      },
      {
        label: 'transcript-observed',
        transcript: transcriptObservationFor('observed'),
        ownedEarlier: 'Read slot release implementation.',
        foreignEarlier: [
          'Read preload bridge notes from the prior turn.',
        ],
      },
    ]

    for (const fixture of fixtures) {
      const { unmount } = render(
        <ReadingHarness initial={fixture.transcript} />,
      )
      const earlier = screen.getByRole('button', { name: 'Load earlier' })
      expect(earlier).not.toBeDisabled()
      await user.click(earlier)
      expect(screen.getByText(fixture.ownedEarlier)).toBeInTheDocument()
      for (const foreign of fixture.foreignEarlier) {
        if (foreign === fixture.ownedEarlier) continue
        expect(screen.queryByText(foreign)).toBeNull()
      }
      unmount()
    }

    for (const transcript of [
      eventsReaderFailedTranscript(),
      retryBudgetDoneTranscript(),
    ]) {
      const { unmount } = render(<ReadingHarness initial={transcript} />)
      const earlier = screen.getByRole('button', { name: 'Load earlier' })
      expect(earlier).toBeDisabled()
      expect(earlier).toHaveAttribute('title', EARLIER_UNAVAILABLE_EXPLANATION)
      expect(
        screen.queryByText('Read slot release implementation.'),
      ).toBeNull()
      expect(
        screen.queryByText('Read preload bridge notes from the prior turn.'),
      ).toBeNull()
      unmount()
    }
  })
})

describe('summary rendering', () => {
  it('pinned transcript states do not render a Summary block', () => {
    render(
      <ObservationHarness
        sequence={[transcriptObservationFor('observed')]}
      />,
    )
    expect(screen.queryByText('Summary')).toBeNull()
    expect(
      screen.queryByText(/not independent proof/),
    ).toBeNull()
  })

  it('completed tasks that carry a summary still show it', () => {
    render(
      <ObservationHarness
        sequence={[transcriptObservationFor('observed')]}
        withSummary
      />,
    )
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Completed summary.')).toBeInTheDocument()
  })
})

describe('TranscriptSurface states', () => {
  it('observed: original request disclosure and activity boundary', () => {
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
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
    render(<ReadingHarness initial={transcriptObservationFor('loading')} />)
    expect(screen.getByLabelText('Loading request')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading history')).toBeInTheDocument()
    expect(screen.queryByText(TRANSCRIPT_REQUEST_TEXT)).toBeNull()
    expect(document.body.textContent).not.toMatch(/0 tool calls/)
  })

  it('partial: truncated request and capture-gap qualification', () => {
    render(<ReadingHarness initial={transcriptObservationFor('partial')} />)
    expect(screen.getByText('Partial request')).toBeInTheDocument()
    expect(screen.getByText('Bounded prefix · truncated')).toBeInTheDocument()
    expect(
      screen.getByText('History incomplete · capture gap'),
    ).toBeInTheDocument()
    const pre = screen.getByText((_c, el) =>
      Boolean(
        el?.tagName === 'PRE' && el.getAttribute('data-copy-text') !== null,
      ),
    )
    expect(pre.textContent?.length).toBe(64)
  })

  it('unavailable: request refusal without inventing assignment text', () => {
    render(
      <ReadingHarness initial={transcriptObservationFor('unavailable')} />,
    )
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
      <ReadingHarness
        initial={transcriptObservationFor('integrity-failed')}
      />,
    )
    expect(
      screen.getByText('Original request · integrity check failed'),
    ).toBeInTheDocument()
    expect(container.textContent).not.toContain('slot release race')
    expect(container.querySelector('[data-copy-text]')).toBeNull()
  })

  it('capacity: keeps rows and offers explicit rebase', () => {
    render(<ReadingHarness initial={transcriptObservationFor('capacity')} />)
    expect(
      screen.getByText(
        'This view reached its limit. Your reading position is kept.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load current activity' }),
    ).toBeInTheDocument()
  })

  it('sources: keeps the tool disclosure and shows the Events stub separately', () => {
    render(
      <ObservationHarness
        sequence={[transcriptObservationFor('events')]}
      />,
    )
    expect(
      screen.getByText('Ran deterministic slot regression'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Unsupported record · public stub'),
    ).toBeInTheDocument()
    expect(screen.getByText('Record ordering')).toBeInTheDocument()
    expect(screen.getByText('Recovered message')).toBeInTheDocument()
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

describe('TranscriptSurface Events pane', () => {
  it('opens Events content with disabled Changes and Artifacts explanations', async () => {
    const user = userEvent.setup()
    render(
      <ObservationHarness
        sequence={[transcriptObservationFor('observed')]}
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
    expect(changes).toHaveAttribute(
      'title',
      'No changes data in this transcript state',
    )
    expect(artifacts).toHaveAttribute(
      'title',
      'No artifacts data in this transcript state',
    )
    await user.click(changes)
    expect(screen.getByTestId('unavailable').textContent).toContain(
      'No changes data',
    )
    await user.click(artifacts)
    expect(screen.getByTestId('unavailable').textContent).toContain(
      'No artifacts data',
    )
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

describe('live region, scroll, and focus through production actions', () => {
  it('live region announces Load earlier with aria-live', async () => {
    const user = userEvent.setup()
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    const live = document.querySelector('[data-d2b-live]')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live).toHaveAttribute('role', 'status')
    expect(live?.textContent).toContain('Earlier captured rows loaded')
  })

  it('Retry keeps focus on a surviving control or the boundary', async () => {
    const user = userEvent.setup()
    render(
      <ReadingHarness initial={transcriptObservationFor('reconnecting')} />,
    )
    const retry = screen.getByRole('button', { name: 'Retry history read' })
    retry.focus()
    await user.click(retry)
    expect(document.activeElement).toBeTruthy()
    const live = document.querySelector('[data-d2b-live]')
    expect(live?.textContent).toContain('Cached rows retained')
    expect(
      document.activeElement ===
        screen.queryByRole('button', { name: 'Retry history read' }) ||
        document.activeElement?.hasAttribute('data-d2b-boundary'),
    ).toBe(true)
  })

  it('Load earlier restores the scroll anchor through the component', async () => {
    const user = userEvent.setup()
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
    const history = document.querySelector('.hd-d2b-history')
    const anchor = document.querySelector('[data-row="anchor"]')
    expect(history).not.toBeNull()
    expect(anchor).not.toBeNull()
    if (!(history instanceof HTMLElement) || !(anchor instanceof HTMLElement)) {
      return
    }
    // Capture: scrollTop=40, offset = 160-100 = 60.
    // After insert the anchor is pushed +80 → top 240.
    // Restored scrollTop = 40 + (240 - 100) - 60 = 120.
    stubAnchorPushAfterEarlier(history, anchor, 100, 160, 80)
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(history.scrollTop).toBe(120)
    expect(
      screen.getByText('Read slot release implementation.'),
    ).toBeInTheDocument()
    const live = document.querySelector('[data-d2b-live]')
    expect(live?.textContent).toContain('Earlier captured rows loaded')
  })

  it('Retry restores the scroll anchor when the boundary height changes', async () => {
    const user = userEvent.setup()
    render(
      <ReadingHarness initial={transcriptObservationFor('reconnecting')} />,
    )
    const history = document.querySelector('.hd-d2b-history')
    const anchor = document.querySelector('[data-row="anchor"]')
    expect(history).not.toBeNull()
    expect(anchor).not.toBeNull()
    if (!(history instanceof HTMLElement) || !(anchor instanceof HTMLElement)) {
      return
    }
    // Capture: scrollTop=40, offset = 160-100 = 60.
    // After Retry the boundary grows and the anchor is pushed +50 → top 210.
    // Restored scrollTop = 40 + (210 - 100) - 60 = 90.
    stubAnchorPushAfterRetry(history, anchor, 100, 160, 50)
    await user.click(screen.getByRole('button', { name: 'Retry history read' }))
    expect(history.scrollTop).toBe(90)
    expect(
      document.querySelector('[data-d2b-live]')?.textContent,
    ).toContain('Cached rows retained')
  })

  it('announces the restore warning instead of success when the anchor is missing', async () => {
    const user = userEvent.setup()
    render(<ReadingHarness initial={transcriptObservationFor('observed')} />)
    const history = document.querySelector('.hd-d2b-history')
    const anchor = document.querySelector('[data-row="anchor"]')
    expect(history).not.toBeNull()
    expect(anchor).not.toBeNull()
    if (!(history instanceof HTMLElement) || !(anchor instanceof HTMLElement)) {
      return
    }
    stubHistoryGeometry(history, anchor, 100, 160)
    // After Load earlier, remove the captured anchor so restore reports a miss.
    const originalQuery = history.querySelectorAll.bind(history)
    vi.spyOn(history, 'querySelectorAll').mockImplementation(
      ((selectors: string) => {
        if (selectors === '[data-row]') {
          return originalQuery('[data-row="earlier"]')
        }
        return originalQuery(selectors)
      }) as typeof history.querySelectorAll,
    )
    await user.click(screen.getByRole('button', { name: 'Load earlier' }))
    expect(screen.getByTestId('announce').textContent).toContain(
      'retained row is outside this view',
    )
    expect(screen.getByTestId('announce').textContent).not.toBe(
      'Earlier captured rows loaded. Reading position retained.',
    )
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

    rerender(
      <TranscriptSurface
        transcript={{
          ...empty,
          rows: [
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
          ],
        }}
        onReadingChange={() => undefined}
        onAnnounce={() => undefined}
      />,
    )
    expect(screen.getByText('Only this row remains.')).toBeInTheDocument()
  })
})

describe('transcript scroll helpers', () => {
  it('restores the captured anchor offset', () => {
    const history = document.createElement('div')
    const row = document.createElement('article')
    row.dataset.row = 'anchor'
    history.appendChild(row)
    document.body.appendChild(history)
    stubHistoryGeometry(history, row, 100, 160)
    const anchor = captureVisibleAnchor(history)
    expect(anchor).toEqual({ id: 'anchor', offset: 60 })
    row.getBoundingClientRect = () =>
      ({ top: 220, bottom: 260, height: 40 }) as DOMRect
    restoreVisibleAnchor(history, anchor)
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
