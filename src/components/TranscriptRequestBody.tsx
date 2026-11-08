import type { RequestView } from '../presentation/transcriptViews'
import { TranscriptRequestText } from './TranscriptRequestText'

type Props = {
  readonly view: RequestView
  readonly canReadMore: boolean
  readonly viewLimitReached: boolean
  readonly onCopy: () => void
  readonly onReadMore: () => void
  readonly onRetry: () => void
}

/** Body of the Original request disclosure. */
export function TranscriptRequestBody(props: Props) {
  const { view } = props
  if (view.loading) {
    return <div className="hd-d2b-skeleton" aria-label="Loading request" />
  }
  if (view.withheld || view.unavailable) {
    return (
      <>
        <p className={view.withheld ? 'hd-d2b-error' : 'hd-muted'}>
          {view.withheld
            ? 'Content withheld because integrity verification failed.'
            : 'The original request could not be read.'}
        </p>
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          data-action="retry-request"
          onClick={props.onRetry}
        >
          Retry request read
        </button>
      </>
    )
  }
  if (!view.text) return null
  return <TranscriptRequestText {...props} text={view.text} />
}
