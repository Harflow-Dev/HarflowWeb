import type { RequestView } from '../presentation/transcriptViews'

type Props = {
  readonly view: RequestView
  readonly text: string
  readonly canReadMore: boolean
  readonly viewLimitReached: boolean
  readonly onCopy: () => void
  readonly onReadMore: () => void
}

/** Verified or partial request text with copy / read-more actions. */
export function TranscriptRequestText(props: Props) {
  const { view } = props
  return (
    <>
      {view.integrity ? <p className="hd-muted">{view.integrity}</p> : null}
      <pre tabIndex={0} data-copy-text>
        {props.text}
      </pre>
      <span className="hd-row hd-d2b-actions">
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          data-action="copy-request"
          onClick={props.onCopy}
        >
          {view.copyLabel}
        </button>
        {props.canReadMore ? (
          <button
            type="button"
            className="hd-btn hd-btn--secondary hd-btn--sm"
            data-action="read-more"
            onClick={props.onReadMore}
          >
            Read more
          </button>
        ) : null}
      </span>
      {props.viewLimitReached ? (
        <p className="hd-muted">
          View limit reached. Full request remains unavailable in this view.
        </p>
      ) : null}
    </>
  )
}