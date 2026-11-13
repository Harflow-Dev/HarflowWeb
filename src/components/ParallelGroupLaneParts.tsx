import { useId } from 'react'
import type {
  InlineRun,
  ParallelGroupLaneEnd,
  ParallelGroupLaneStatus,
  WorkflowRunLaneBlock,
} from '../model'
import { Icon, type IconName } from './Icon'
import {
  PARALLEL_GROUP_HISTORY_EXPLANATION,
  PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID,
  PARALLEL_GROUP_TOOL_EXPLANATION,
  PARALLEL_GROUP_TOOL_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

export function LanePrompt({ prompt }: { readonly prompt: string }) {
  const copyId = useId()
  return (
    <details className="hd-d2b-request" open data-disclosure="request">
      <summary>Original request</summary>
      <p className="hd-m05-caption">Complete stored request</p>
      <pre>{prompt}</pre>
      <div className="hd-row hd-d2b-actions">
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          disabled
          aria-disabled="true"
          aria-describedby={copyId}
          title="Unavailable. Copy does not run in this mock."
        >
          Copy original request
        </button>
        <span id={copyId} className="hd-sr">
          Unavailable. Copy does not run in this mock.
        </span>
      </div>
    </details>
  )
}

export function HistoryBoundary({ message }: { readonly message: string }) {
  return (
    <div
      className="hd-d2b-boundary"
      role="group"
      aria-label="History boundary"
    >
      <strong>{message}</strong>
      <div className="hd-row hd-d2b-actions">
        <button
          type="button"
          className="hd-btn hd-btn--secondary hd-btn--sm"
          disabled
          aria-disabled="true"
          aria-describedby={PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID}
          title={PARALLEL_GROUP_HISTORY_EXPLANATION}
        >
          Load current activity
        </button>
      </div>
    </div>
  )
}

export function LaneEndRow({ end }: { readonly end: ParallelGroupLaneEnd }) {
  const word =
    end.kind === 'done' ? 'Done' : end.kind === 'failed' ? 'Failed' : 'Cancelled'
  const text = end.extra
    ? `${word} · ${end.extra} · ${end.clock}`
    : `${word} · ${end.clock}`
  return (
    <div className={`hd-pl-end hd-pl-end--${end.kind}`}>
      <LaneGlyph status={end.kind} decorative />
      <span>{text}</span>
    </div>
  )
}

export function LaneGlyph({
  status,
  decorative = false,
}: {
  readonly status: ParallelGroupLaneStatus | ParallelGroupLaneEnd['kind']
  readonly decorative?: boolean
}) {
  const label =
    status === 'done'
      ? 'Done'
      : status === 'running'
        ? 'Running'
        : status === 'failed'
          ? 'Failed'
          : status === 'cancelled'
            ? 'Cancelled'
            : 'Pending'
  if (status === 'done') {
    return (
      <span
        className="hd-glyph hd-glyph--done"
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span
        className="hd-glyph hd-glyph--running"
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      />
    )
  }
  if (status === 'failed') {
    return (
      <span
        className="hd-glyph hd-glyph--failed"
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <Icon name="x" size="sm" />
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span
        className="hd-glyph hd-glyph--cancelled"
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        <Icon name="stop" size="sm" />
      </span>
    )
  }
  return (
    <span
      className="hd-glyph hd-glyph--queued"
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    />
  )
}

export function LaneBlock({ block }: { readonly block: WorkflowRunLaneBlock }) {
  if (block.kind === 'agent') {
    return (
      <div className="hd-msg-agent">
        <p>
          <InlineRuns runs={block.runs} />
        </p>
        {block.listItems && block.listItems.length > 0 ? (
          <ul>
            {block.listItems.map((item, index) => (
              <li key={index}>
                <InlineRuns runs={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }
  if (block.kind === 'tool') {
    const iconName: IconName = block.icon ?? 'terminal'
    const summaryKind = block.summaryKind ?? 'ran-code'
    return (
      <div className="hd-tool">
        <button
          type="button"
          className="hd-tool__head"
          disabled
          aria-disabled="true"
          aria-expanded="false"
          aria-describedby={PARALLEL_GROUP_TOOL_UNAVAILABLE_ID}
          title={PARALLEL_GROUP_TOOL_EXPLANATION}
        >
          <Icon name={iconName} size="sm" />
          <span className="hd-tool__summary">
            {summaryKind === 'plain' ? (
              block.summary
            ) : (
              <>
                Ran <code>{block.summary}</code>
              </>
            )}
          </span>
          <span className="hd-tool__meta">{block.duration}</span>
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
    )
  }
  if (block.kind === 'result') {
    return (
      <div className="hd-pl-end hd-pl-end--done">
        <span className="hd-glyph hd-glyph--done" aria-hidden="true">
          <Icon name="check" size="sm" />
        </span>
        <span>{block.text}</span>
      </div>
    )
  }
  if (block.kind === 'working') {
    return (
      <div className="hd-working">
        <span className="hd-glyph hd-glyph--running" aria-hidden="true" />
        <span>{block.text}</span>
      </div>
    )
  }
  return (
    <div className="hd-pl-waiting">
      <span className="hd-glyph hd-glyph--queued" aria-hidden="true" />
      <span className="body">{block.title}</span>
      <span className="caption">{block.caption}</span>
    </div>
  )
}

function InlineRuns({ runs }: { readonly runs: readonly InlineRun[] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.kind === 'code' ? (
          <code key={index}>{run.value}</code>
        ) : (
          <span key={index}>{run.value}</span>
        ),
      )}
    </>
  )
}
