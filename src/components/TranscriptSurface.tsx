import { useLayoutEffect, useRef } from 'react'
import type { TranscriptObservation } from '../model'
import {
  activityView,
  requestView,
} from '../presentation/transcriptViews'
import {
  transitionTranscript,
  type TranscriptAction,
} from '../presentation/transcriptTransition'
import {
  applyFocusAfterAction,
  captureVisibleAnchor,
  focusTargetFor,
  restoreVisibleAnchor,
  type VisibleAnchor,
} from './transcriptScroll'
import { TranscriptBoundary } from './TranscriptBoundary'
import { TranscriptRequest } from './TranscriptRequest'
import { TranscriptRows } from './TranscriptRows'

type Props = {
  readonly transcript: TranscriptObservation
  readonly onReadingChange: (next: TranscriptObservation) => void
  readonly onAnnounce: (message: string) => void
}

type PendingRestore = {
  readonly anchor: VisibleAnchor | null
  readonly scrollTop: number
  readonly action: TranscriptAction
  readonly message: string
}

/**
 * Request disclosure, boundary, rows and live region for Design 854caae
 * transcript states. Local reading actions preserve scroll anchor and focus.
 */
export function TranscriptSurface({
  transcript,
  onReadingChange,
  onAnnounce,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const pendingRestore = useRef<PendingRestore | null>(null)

  const request = requestView(transcript)
  const activity = activityView(transcript)
  const canReadMore =
    (transcript.request === 'truncated' ||
      transcript.request === 'unverified') &&
    transcript.requestMaxBytes < 128
  const viewLimitReached =
    (transcript.request === 'truncated' ||
      transcript.request === 'unverified') &&
    transcript.requestMaxBytes === 128

  useLayoutEffect(() => {
    const pending = pendingRestore.current
    if (!pending) return
    pendingRestore.current = null
    const history = historyRef.current
    const host = hostRef.current
    if (!host) return
    let restoreWarning = ''
    if (pending.action === 'earlier') {
      restoreVisibleAnchor(
        history,
        pending.anchor,
        (message) => {
          restoreWarning = message
        },
        (message) => {
          restoreWarning = message
        },
        pending.message,
      )
    } else if (pending.action === 'rebase') {
      if (history) history.scrollTop = 0
    } else if (pending.action === 'new') {
      if (history) history.scrollTop = history.scrollHeight
    } else if (history) {
      history.scrollTop = pending.scrollTop
    }
    applyFocusAfterAction(host, history, focusTargetFor(pending.action))
    // Restore warnings replace the success announcement when the offset fails.
    const finalMessage = restoreWarning || pending.message
    if (finalMessage) onAnnounce(finalMessage)
  })

  function apply(action: TranscriptAction): void {
    const history = historyRef.current
    const anchor = captureVisibleAnchor(history)
    const scrollTop = history?.scrollTop ?? 0
    const next = transitionTranscript(transcript, action)
    pendingRestore.current = {
      anchor,
      scrollTop,
      action,
      message: next.liveMessage,
    }
    onReadingChange(next)
  }

  async function copyText(
    selector: '[data-copy-text]',
    success: string,
  ): Promise<void> {
    const el = hostRef.current?.querySelector(selector)
    if (!(el instanceof HTMLElement) || !el.textContent) {
      onAnnounce('Nothing to copy in this view.')
      return
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable')
      await navigator.clipboard.writeText(el.textContent)
      onAnnounce(success)
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      el.focus()
      onAnnounce('Text selected. Use your system copy command to copy it.')
    }
  }

  return (
    <div className="hd-tr-host" ref={hostRef} style={{ display: 'contents' }}>
      <TranscriptRequest
        view={request}
        canReadMore={canReadMore}
        viewLimitReached={viewLimitReached}
        onCopy={() =>
          void copyText(
            '[data-copy-text]',
            'Copied displayed mock request text.',
          )
        }
        onReadMore={() => apply('read-more')}
        onRetry={() => apply('retry-request')}
      />
      <div
        ref={historyRef}
        className="hd-scroll hd-d2b-history"
        tabIndex={0}
        aria-label="Captured transcript"
      >
        <TranscriptBoundary
          activity={activity}
          history={transcript.history}
          olderLoaded={transcript.olderLoaded}
          freshShown={transcript.freshShown}
          pendingSourceChange={transcript.pendingSourceEpoch !== null}
          onEarlier={() => apply('earlier')}
          onNew={() => apply('new')}
          onRetry={() => apply('retry')}
          onRebase={() => apply('rebase')}
        />
        <div data-d2b-rows>
          <TranscriptRows transcript={transcript} />
        </div>
      </div>
      <div
        className="hd-d2b-live hd-muted"
        role="status"
        aria-live="polite"
        data-d2b-live
      >
        {transcript.liveMessage}
      </div>
    </div>
  )
}
