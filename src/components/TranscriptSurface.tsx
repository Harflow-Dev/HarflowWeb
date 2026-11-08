import type { TranscriptObservation } from '../model'
import {
  activityView,
  requestView,
} from '../presentation/transcriptViews'
import {
  transitionTranscript,
  type TranscriptAction,
} from '../presentation/transcriptTransition'
import { TranscriptBoundary } from './TranscriptBoundary'
import { TranscriptRequest } from './TranscriptRequest'
import { TranscriptRows } from './TranscriptRows'

type Props = {
  readonly transcript: TranscriptObservation
  readonly onTranscriptChange: (next: TranscriptObservation) => void
  readonly onAnnounce: (message: string) => void
}

/**
 * Request disclosure, boundary, rows and live region for Design 854caae
 * transcript states. Local actions never invent observation progress.
 */
export function TranscriptSurface({
  transcript,
  onTranscriptChange,
  onAnnounce,
}: Props) {
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

  function apply(action: TranscriptAction): void {
    const next = transitionTranscript(transcript, action)
    onTranscriptChange(next)
    if (next.liveMessage) onAnnounce(next.liveMessage)
  }

  function announceLocal(message: string): void {
    onTranscriptChange({ ...transcript, liveMessage: message })
    onAnnounce(message)
  }

  async function copyText(
    selector: '[data-copy-text]' | '[data-record]',
    success: string,
  ): Promise<void> {
    const el = document.querySelector(selector)
    if (!(el instanceof HTMLElement) || !el.textContent) {
      announceLocal('Nothing to copy in this view.')
      return
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable')
      await navigator.clipboard.writeText(el.textContent)
      announceLocal(success)
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      el.focus()
      announceLocal('Text selected. Use your system copy command to copy it.')
    }
  }

  return (
    <>
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
    </>
  )
}
