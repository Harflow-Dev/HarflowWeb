import type { SubmissionStatus } from '../presentation'

type Props = {
  readonly submission: SubmissionStatus
  readonly contextNote: string | null
  readonly unavailableNav: string | null
}

/** Accessible live region — kept out of the main design hero composition. */
export function StatusRegion({
  submission,
  contextNote,
  unavailableNav,
}: Props) {
  // Submission outcomes outrank context notes so partial-sidebar coverage
  // does not swallow accepted / refused / unknown announcements.
  let message = ''
  if (unavailableNav) {
    message = `${unavailableNav} is unavailable in this exploratory slice.`
  } else if (submission.kind === 'pending') {
    message = 'Starting task…'
  } else if (submission.kind === 'accepted') {
    message = `Accepted mock task ${submission.taskId}. Destination screens are not built in this slice.`
  } else if (submission.kind === 'refused') {
    message = `Refused (${submission.code}): ${submission.reason}. Draft preserved.`
  } else if (submission.kind === 'unknown') {
    message = `Unknown: ${submission.message}. Do not retry automatically. Draft preserved.`
  } else if (contextNote) {
    message = contextNote
  }

  return (
    <div
      className="hw-status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  )
}
