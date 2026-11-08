import type { TranscriptHistoryKind } from '../model'
import { TranscriptEarlierAction } from './TranscriptEarlierAction'

type Props = {
  readonly history: TranscriptHistoryKind
  readonly olderLoaded: boolean
  readonly freshShown: boolean
  readonly pendingSourceChange: boolean
  /** False when the observation has no earlier prototype for this task. */
  readonly earlierAvailable: boolean
  /** False when the observation has no fresh prototype for this task. */
  readonly freshAvailable: boolean
  readonly onEarlier: () => void
  readonly onNew: () => void
  readonly onRetry: () => void
  readonly onRebase: () => void
}

/** History action buttons for the transcript boundary notice. */
export function TranscriptBoundaryActions(props: Props) {
  const { history } = props
  const offerEarlierSlot =
    ['observed', 'partial', 'unknown'].includes(history) && !props.olderLoaded
  const showRetry = history === 'reconnecting' || history === 'nonprogress'
  const showRebase =
    history === 'capacity' ||
    history === 'reset' ||
    props.pendingSourceChange
  const showNew =
    history === 'observed' && !props.freshShown && props.freshAvailable

  return (
    <div className="hd-row hd-d2b-actions">
      {offerEarlierSlot ? (
        <TranscriptEarlierAction
          available={props.earlierAvailable}
          onEarlier={props.onEarlier}
        />
      ) : null}
      {showRetry ? (
        <Action
          label="Retry history read"
          action="retry"
          onClick={props.onRetry}
        />
      ) : null}
      {showRebase ? (
        <>
          <p>
            Loading current activity replaces the rows in this view. Execution
            continues independently.
          </p>
          <Action
            label="Load current activity"
            action="rebase"
            onClick={props.onRebase}
          />
        </>
      ) : null}
      {showNew ? (
        <Action
          label="New activity · show"
          action="new"
          onClick={props.onNew}
        />
      ) : null}
    </div>
  )
}

function Action({
  label,
  action,
  onClick,
}: {
  readonly label: string
  readonly action: string
  readonly onClick: () => void
}) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--secondary hd-btn--sm"
      data-action={action}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
