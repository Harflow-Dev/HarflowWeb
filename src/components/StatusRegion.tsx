import { useState } from 'react'
import type { SubmissionStatus } from '../presentation'

type Props = {
  readonly submission: SubmissionStatus
  readonly contextNote: string | null
  readonly unavailableNav: string | null
  /** Raw status announcement (copy success, etc.); spoken as-is. */
  readonly announceNote?: string | null
  /**
   * Changes on every ephemeral note (`unavailableNav` / `announceNote`), so a
   * repeat of the same text is announced again.
   */
  readonly noteNonce?: number
  /** First-load label of the main screen, e.g. "Loading workflows". */
  readonly loadingNote?: string | null
}

type Source = 'submission' | 'loading' | 'none'

/**
 * Which source the region speaks for: whichever changed most recently. A
 * retained submission outcome stops being announced once a later first load
 * starts, and stays quiet after that load ends. A new submission outcome
 * takes the region back. The outcome itself stays visible where it is shown.
 */
function useAnnouncedSource(
  submission: SubmissionStatus,
  loadingNote: string | null,
): Source {
  const submissionKey = JSON.stringify(submission)
  const [source, setSource] = useState<Source>('submission')
  const [seen, setSeen] = useState({ submissionKey, loadingNote })
  if (seen.submissionKey !== submissionKey) {
    setSeen({ submissionKey, loadingNote })
    setSource('submission')
    return 'submission'
  }
  if (seen.loadingNote !== loadingNote) {
    const next: Source =
      loadingNote !== null ? 'loading' : source === 'loading' ? 'none' : source
    setSeen({ submissionKey, loadingNote })
    setSource(next)
    return next
  }
  return source
}

/**
 * Accessible live region — kept out of the main design hero composition.
 * Always mounted so later text is announced; with no text it draws no box.
 */
export function StatusRegion({
  submission,
  contextNote,
  unavailableNav,
  announceNote = null,
  noteNonce = 0,
  loadingNote = null,
}: Props) {
  // Submission outcomes outrank context notes so partial-sidebar coverage
  // does not swallow accepted / refused / unknown announcements.
  const source = useAnnouncedSource(submission, loadingNote)
  const speakSubmission = source === 'submission'
  let message = ''
  if (announceNote) {
    message = announceNote
  } else if (unavailableNav) {
    message = `${unavailableNav} is unavailable in this exploratory slice.`
  } else if (!speakSubmission) {
    message = loadingNote ?? contextNote ?? ''
  } else if (submission.kind === 'pending') {
    message = 'Starting task…'
  } else if (submission.kind === 'accepted') {
    message = `Accepted mock task ${submission.taskId}. Destination screens are not built in this slice.`
  } else if (submission.kind === 'refused') {
    message = `Refused (${submission.code}): ${submission.reason}. Draft preserved.`
  } else if (submission.kind === 'unknown') {
    message = `Unknown: ${submission.message}. Do not retry automatically. Draft preserved.`
  } else if (loadingNote) {
    message = loadingNote
  } else if (contextNote) {
    message = contextNote
  }

  return (
    <div
      className={message === '' ? 'hw-status hw-status--empty' : 'hw-status'}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span key={noteNonce}>{message}</span>
    </div>
  )
}
