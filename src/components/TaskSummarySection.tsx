import type { AgentSegment, TaskSummary } from '../model'

type Props = {
  readonly summary: TaskSummary
}

/**
 * Approved task/done summary inside the transcript.
 * Fixture-reported evidence only — not independently verified changes.
 */
export function TaskSummarySection({ summary }: Props) {
  return (
    <>
      <div className="hd-turn-sep">{summary.heading}</div>
      <div className="hd-msg-agent">
        {summary.segments.map((segment, index) => (
          <SummarySegment key={index} segment={segment} />
        ))}
      </div>
    </>
  )
}

function SummarySegment({ segment }: { readonly segment: AgentSegment }) {
  if (segment.kind === 'paragraph') {
    return (
      <p>
        {segment.runs.map((run, i) =>
          run.kind === 'code' ? (
            <code key={i}>{run.value}</code>
          ) : (
            <span key={i}>{run.value}</span>
          ),
        )}
      </p>
    )
  }
  return (
    <ul>
      {segment.items.map((item, index) => (
        <li key={index}>
          {item.map((run, i) =>
            run.kind === 'code' ? (
              <code key={i}>{run.value}</code>
            ) : (
              <span key={i}>{run.value}</span>
            ),
          )}
        </li>
      ))}
    </ul>
  )
}
