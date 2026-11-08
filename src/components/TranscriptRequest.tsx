import type { RequestView } from '../presentation/transcriptViews'
import { TranscriptRequestBody } from './TranscriptRequestBody'

type Props = {
  readonly view: RequestView
  readonly canReadMore: boolean
  readonly viewLimitReached: boolean
  readonly onCopy: () => void
  readonly onReadMore: () => void
  readonly onRetry: () => void
}

/** Original request disclosure — withheld text is never mounted. */
export function TranscriptRequest(props: Props) {
  return (
    <details className="hd-d2b-request" open data-disclosure="request">
      <summary>{props.view.title}</summary>
      <TranscriptRequestBody {...props} />
    </details>
  )
}
