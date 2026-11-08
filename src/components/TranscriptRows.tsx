import type { TranscriptObservation, TranscriptRow } from '../model'

type Props = {
  readonly transcript: TranscriptObservation
}

/** Renders observation-owned rows keyed by source/window identity. */
export function TranscriptRows({ transcript }: Props) {
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
      {transcript.rows.map((row) => (
        <TranscriptRowView key={rowKey(row)} row={row} />
      ))}
    </>
  )
}

function rowKey(row: TranscriptRow): string {
  return `${row.sourceEpoch}:${row.windowEpoch}:${row.occurrence}:${row.id}`
}

function TranscriptRowView({ row }: { readonly row: TranscriptRow }) {
  if (row.type === 'tool_result' && row.toolSummary) {
    return (
      <article className="hd-d2b-row hd-msg-agent" data-row={row.anchorId}>
        <details data-disclosure={row.disclosure ?? `tool-${row.id}`}>
          <summary className="hd-tool__head">
            <span
              className="hd-i hd-i--sm hd-i-terminal"
              aria-hidden="true"
            />
            <span className="hd-tool__summary">{row.toolSummary}</span>
            <span
              className="hd-i hd-i--sm hd-i-chevron-right hd-d2b-tool-chevron"
              aria-hidden="true"
            />
          </summary>
          {row.toolBody ? (
            <pre className="hd-tool__body">{row.toolBody}</pre>
          ) : null}
        </details>
      </article>
    )
  }
  return (
    <article className="hd-d2b-row hd-msg-agent" data-row={row.anchorId}>
      <strong>{row.title}</strong>
      {row.body ? <p>{row.body}</p> : null}
    </article>
  )
}
