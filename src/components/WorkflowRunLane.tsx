import type { InlineRun } from '../model'
import type { WorkflowRunLane, WorkflowRunLaneBlock } from '../presentation'
import { Icon } from './Icon'
import {
  RUN_LANE_UNAVAILABLE_ID,
  RUN_TOOL_UNAVAILABLE_ID,
  WORKFLOW_RUN_LANE_EXPLANATION,
  WORKFLOW_RUN_TOOL_EXPLANATION,
} from './workflowRunUnavailable'

type Props = {
  readonly lane: WorkflowRunLane
}

/** One read-only Parallel lane. Composers and lane actions stay disabled. */
export function WorkflowRunLane({ lane }: Props) {
  const messageLabel = `Message ${lane.composerName}`
  const sendLabel = `Send to ${lane.composerName}`
  return (
    <section
      className="hd-lane"
      aria-label={lane.title}
      style={{ flex: '1 0 320px', minWidth: 320 }}
    >
      <div className="hd-lane__head">
        <LaneGlyph status={lane.status} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="hd-lane__title">{lane.title}</span>
          <span className="caption hd-faint">{lane.agentLabel}</span>
        </div>
        <span className="caption" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {lane.statusMeta}
        </span>
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="Lane actions"
          disabled
          aria-disabled="true"
          aria-describedby={RUN_LANE_UNAVAILABLE_ID}
          title={WORKFLOW_RUN_LANE_EXPLANATION}
        >
          <Icon name="more" />
        </button>
      </div>
      <div className="hd-lane__body">
        {lane.blocks.map((block, index) => (
          <LaneBlock key={`${lane.id}-${index}`} block={block} />
        ))}
      </div>
      {lane.status === 'pending' ? null : (
        <div className="hd-lane__foot">
          <form
            className="hd-composer"
            aria-label={messageLabel}
            style={{
              padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-3)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="hd-sr" htmlFor={`msg-${lane.id}`}>
              {messageLabel}
            </label>
            <textarea
              id={`msg-${lane.id}`}
              className="hd-composer__input"
              rows={1}
              placeholder={messageLabel}
              style={{ minHeight: 24 }}
              disabled
              aria-disabled="true"
              aria-describedby={RUN_LANE_UNAVAILABLE_ID}
            />
            <button
              type="submit"
              className="hd-composer__send"
              aria-label={sendLabel}
              disabled
              aria-disabled="true"
              aria-describedby={RUN_LANE_UNAVAILABLE_ID}
              style={{ width: 28, height: 28 }}
            >
              <Icon name="arrow-up" />
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

function LaneGlyph({ status }: { readonly status: WorkflowRunLane['status'] }) {
  if (status === 'done') {
    return (
      <span className="hd-glyph hd-glyph--done" aria-label="Done">
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (status === 'running') {
    return <span className="hd-glyph hd-glyph--running" aria-label="Running" />
  }
  return <span className="hd-glyph hd-glyph--queued" aria-label="Pending" />
}

function LaneBlock({ block }: { readonly block: WorkflowRunLaneBlock }) {
  if (block.kind === 'agent') {
    return (
      <div className="hd-msg-agent">
        <p>
          <InlineRuns runs={block.runs} />
        </p>
      </div>
    )
  }
  if (block.kind === 'tool') {
    return (
      <div className="hd-tool">
        <button
          type="button"
          className="hd-tool__head"
          disabled
          aria-disabled="true"
          aria-expanded="false"
          aria-describedby={RUN_TOOL_UNAVAILABLE_ID}
          title={WORKFLOW_RUN_TOOL_EXPLANATION}
        >
          <Icon name="terminal" size="sm" />
          <span className="hd-tool__summary">
            Ran <code>{block.summary}</code>
          </span>
          <span className="hd-tool__meta">{block.duration}</span>
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
    )
  }
  if (block.kind === 'result') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 13,
          lineHeight: '18px',
          fontWeight: 500,
          color: 'var(--success)',
        }}
      >
        <span className="hd-glyph hd-glyph--done" aria-label="Done">
          <Icon name="check" size="sm" />
        </span>
        <span>{block.text}</span>
      </div>
    )
  }
  if (block.kind === 'working') {
    return (
      <div className="hd-working">
        <span className="hd-glyph hd-glyph--running is-animated" aria-hidden="true" />
        <span>{block.text}</span>
      </div>
    )
  }
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
      }}
    >
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
