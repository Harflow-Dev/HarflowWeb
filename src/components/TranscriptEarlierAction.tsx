import { useId } from 'react'

/** Drawn when Load earlier is present but this mock has no earlier page. */
export const EARLIER_UNAVAILABLE_EXPLANATION =
  'Available captured history reached its beginning. Reading position retained.'

type Props = {
  readonly available: boolean
  readonly onEarlier: () => void
}

/** Enabled or disabled Load earlier control for the transcript boundary. */
export function TranscriptEarlierAction({ available, onEarlier }: Props) {
  const explanationId = useId()
  if (available) {
    return (
      <button
        type="button"
        className="hd-btn hd-btn--secondary hd-btn--sm"
        data-action="earlier"
        onClick={onEarlier}
      >
        Load earlier
      </button>
    )
  }
  return (
    <>
      <button
        type="button"
        className="hd-btn hd-btn--secondary hd-btn--sm is-disabled"
        data-action="earlier"
        aria-disabled="true"
        disabled
        aria-describedby={explanationId}
      >
        Load earlier
      </button>
      <p id={explanationId}>{EARLIER_UNAVAILABLE_EXPLANATION}</p>
    </>
  )
}
