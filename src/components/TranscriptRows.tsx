import type { TranscriptObservation } from '../model'

type Props = {
  readonly transcript: TranscriptObservation
}

/** Captured activity rows for the Design 854caae transcript surface. */
export function TranscriptRows({ transcript }: Props) {
  if (transcript.currentWindow) {
    return (
      <>
        {transcript.olderLoaded ? <EarlierRow /> : null}
        <article className="hd-d2b-row hd-msg-agent" data-row="new">
          <strong>Current activity window</strong>
          <p>
            This view now shows current captured activity. Earlier rows are
            outside this view.
          </p>
        </article>
      </>
    )
  }
  if (transcript.history === 'loading') {
    return <div className="hd-d2b-skeleton" aria-label="Loading history" />
  }
  if (
    transcript.history === 'empty' ||
    transcript.history === 'unsupported' ||
    transcript.history === 'unavailable'
  ) {
    return null
  }
  return (
    <>
      {transcript.olderLoaded ? <EarlierRow /> : null}
      <article className="hd-d2b-row hd-msg-agent" data-row="anchor">
        <strong>Codex</strong>
        <p>
          I found the notification outside the lock. I will reproduce the race
          before changing it.
        </p>
      </article>
      <article className="hd-d2b-row hd-msg-agent" data-row="tool">
        <details data-disclosure="tool-regression">
          <summary className="hd-tool__head">
            <span
              className="hd-i hd-i--sm hd-i-terminal"
              aria-hidden="true"
            />
            <span className="hd-tool__summary">
              Ran deterministic slot regression
            </span>
            <span
              className="hd-i hd-i--sm hd-i-chevron-right hd-d2b-tool-chevron"
              aria-hidden="true"
            />
          </summary>
          <pre className="hd-tool__body">
            {`Mock focused regression
Arrange: hold the release lock
Start a waiting consumer
Release and notify under the lock
Assert: consumer observes the free slot
Result: deterministic race reproduced
Patch: notification moved under lock
Result after patch: focused regression passed`}
          </pre>
        </details>
      </article>
      <article
        className="hd-d2b-row hd-msg-agent"
        data-row="validation-summary"
      >
        <strong>Codex</strong>
        <p>
          The notification now runs under the lock. The focused regression
          passed in this mock transcript.
        </p>
      </article>
      {transcript.freshShown ? (
        <article className="hd-d2b-row hd-msg-agent" data-row="new">
          <strong>New captured activity</strong>
          <p>Focused validation result received.</p>
        </article>
      ) : null}
    </>
  )
}

function EarlierRow() {
  return (
    <article className="hd-d2b-row hd-msg-agent" data-row="earlier">
      <strong>Earlier captured activity</strong>
      <p>Read slot release implementation.</p>
    </article>
  )
}
