import type { ActivityView } from '../presentation/transcriptViews'
import type { TranscriptHistoryKind } from '../model'
import { TranscriptBoundaryActions } from './TranscriptBoundaryActions'

type Props = {
  readonly activity: ActivityView
  readonly history: TranscriptHistoryKind
  readonly olderLoaded: boolean
  readonly freshShown: boolean
  readonly pendingSourceChange: boolean
  readonly onEarlier: () => void
  readonly onNew: () => void
  readonly onRetry: () => void
  readonly onRebase: () => void
}

/** Boundary notice and history actions above the captured rows. */
export function TranscriptBoundary(props: Props) {
  return (
    <div className="hd-d2b-boundary" data-d2b-boundary tabIndex={-1}>
      <strong>{props.activity.title}</strong>
      <TranscriptBoundaryActions {...props} />
    </div>
  )
}
