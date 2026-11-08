import type { TranscriptObservation } from '../model'
import { activityView } from '../presentation/transcriptViews'

type Props = {
  readonly transcript: TranscriptObservation
  readonly executionStatus: 'Running' | 'Done'
  readonly onCopyRecord: () => void
  readonly onUnavailable: (label: string) => void
}

/**
 * Events right pane for transcript states (Design 854caae).
 * Changes and Artifacts stay disabled with an accessible explanation.
 */
export function TaskEventsPane({
  transcript,
  executionStatus,
  onCopyRecord,
  onUnavailable,
}: Props) {
  const activity = activityView(transcript)
  const recordText = transcript.normalizedRecord
    ? JSON.stringify(transcript.normalizedRecord, null, 2)
    : null
  const stubText = transcript.stubRecord
    ? JSON.stringify(transcript.stubRecord, null, 2)
    : null
  const orderingText =
    transcript.ordering.length > 0
      ? JSON.stringify(transcript.ordering, null, 2)
      : null

  return (
    <aside className="hd-pane" aria-label="Task details">
      <div className="hd-pane__head">
        <div className="hd-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className="hd-tab is-disabled"
            aria-disabled="true"
            title="No changes data in this transcript state"
            onClick={() =>
              onUnavailable('No changes data in this transcript state')
            }
          >
            Changes
          </button>
          <button
            type="button"
            role="tab"
            className="hd-tab is-disabled"
            aria-disabled="true"
            title="No artifacts data in this transcript state"
            onClick={() =>
              onUnavailable('No artifacts data in this transcript state')
            }
          >
            Artifacts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className="hd-tab is-active"
          >
            Events
          </button>
        </div>
      </div>
      <div className="hd-scroll hd-m05-panescroll">
        <div className="hd-d2b-facts hd-tr-facts" data-d2b-facts>
          <h3>Captured activity facts</h3>
          <p>{activity.countLabel}</p>
          <p className="hd-muted">{activity.reason}</p>
          <hr />
          <h3>Task snapshot</h3>
          <p>
            Status: {executionStatus} · independent of captured activity
          </p>
          <hr />
          <h3>Captured activity</h3>
          <p className="hd-muted">
            Public normalized events · bounded record window
          </p>
          {recordText === null ? (
            <p className="hd-muted">No records available in this view.</p>
          ) : (
            <details data-disclosure="event-result">
              <summary>Tool result · normalized record</summary>
              <pre data-record>{recordText}</pre>
              <button
                type="button"
                className="hd-btn hd-btn--secondary hd-btn--sm"
                data-action="copy-record"
                onClick={onCopyRecord}
              >
                Copy normalized record
              </button>
            </details>
          )}
          {stubText !== null ? (
            <details data-disclosure="event-stub">
              <summary>Unsupported record · public stub</summary>
              <pre>{stubText}</pre>
              <p>No tool summary is inferred from this record.</p>
            </details>
          ) : null}
          {orderingText !== null ? (
            <details data-disclosure="event-order">
              <summary>Record ordering</summary>
              <pre>{orderingText}</pre>
              <p>
                Duplicate and regressing sequence values remain in observed
                order.
              </p>
            </details>
          ) : null}
          <hr />
          <h3>Recovered transcript</h3>
          <p className="hd-muted">
            Separate recovery source. Not used for captured activity totals.
          </p>
          <details data-disclosure="recovery-message">
            <summary>Recovered message</summary>
            <p>{transcript.recoveredMessage}</p>
          </details>
        </div>
      </div>
    </aside>
  )
}
