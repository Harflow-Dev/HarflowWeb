import type { InlineRun, WorkflowRunOnDemand, WorkflowRunOnDemandCall } from '../model'
import { Icon } from './Icon'
import { RUN_CALL_UNAVAILABLE_ID, RUN_TOOL_UNAVAILABLE_ID } from './workflowRunUnavailable'

type Props = {
  readonly detail: WorkflowRunOnDemand
  readonly onClose: () => void
}

/** Read-only on-demand call inspector. Open task and the composer stay disabled. */
export function WorkflowRunOnDemandPane({ detail, onClose }: Props) {
  const call = highlightedCall(detail)
  return (
    <aside className="hd-pane" style={{ width: 460 }} aria-label="Selected on-demand node">
      <div className="hd-pane__head">
        <span className="hd-topbar__title">{detail.title}</span>
        <span className="caption hd-faint">{detail.caption}</span>
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className="hd-btn hd-btn--icon hd-btn--sm"
          aria-label="Close"
          onClick={onClose}
        >
          <Icon name="x" size="sm" />
        </button>
      </div>
      <div
        className="hd-scroll hd-thin-scroll"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <p className="body" style={{ margin: 0, color: 'var(--text-secondary)' }}>
          {detail.introduction}
        </p>
        <CallList detail={detail} />
        {call ? <ShownCall call={call} /> : null}
      </div>
      <NodeComposer title={detail.title} />
    </aside>
  )
}

function highlightedCall(detail: WorkflowRunOnDemand): WorkflowRunOnDemandCall | null {
  const row = detail.calls.find((item) => item.id === detail.call.id && item.highlighted)
  return row ? detail.call : null
}

function CallList({ detail }: { readonly detail: WorkflowRunOnDemand }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <span className="hd-inspector__label">CALLS</span>
      {detail.calls.map((row) => (
        <div
          key={row.id}
          data-highlighted={row.highlighted ? 'true' : 'false'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '8px var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            lineHeight: '18px',
            background: row.highlighted ? 'var(--surface-active)' : undefined,
          }}
        >
          <span className="hd-glyph hd-glyph--done" aria-label="Done">
            <Icon name="check" size="sm" />
          </span>
          <span style={{ flex: '1 1 auto', minWidth: 0, fontWeight: row.highlighted ? 600 : undefined }}>
            {row.label}
          </span>
          <DisabledOpenTask />
        </div>
      ))}
    </div>
  )
}

function DisabledOpenTask() {
  return (
    <button
      type="button"
      className="hd-link"
      disabled
      aria-disabled="true"
      aria-describedby={RUN_CALL_UNAVAILABLE_ID}
      style={{
        background: 'none',
        border: 0,
        padding: 0,
        font: 'inherit',
        opacity: 0.45,
        cursor: 'default',
      }}
    >
      Open task
    </button>
  )
}

function ShownCall({ call }: { readonly call: WorkflowRunOnDemandCall }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        paddingTop: 'var(--space-3)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <span className="caption hd-faint">{call.caption}</span>
      <div className="hd-msg-user">{call.userMessage}</div>
      <div className="hd-msg-agent">
        <p>
          <InlineRuns runs={call.agentRuns} />
        </p>
      </div>
      <div className="hd-tool">
        <button
          type="button"
          className="hd-tool__head"
          disabled
          aria-disabled="true"
          aria-expanded={false}
          aria-describedby={RUN_TOOL_UNAVAILABLE_ID}
        >
          <Icon name="terminal" size="sm" />
          <span className="hd-tool__summary">
            Ran <code>{call.tool.summary}</code>
          </span>
          <span className="hd-tool__meta">{call.tool.duration}</span>
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
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
        <span>{call.result}</span>
      </div>
    </div>
  )
}

function InlineRuns({ runs }: { readonly runs: readonly InlineRun[] }) {
  return runs.map((run, index) =>
    run.kind === 'code' ? (
      <code key={index}>{run.value}</code>
    ) : (
      <span key={index}>{run.value}</span>
    ),
  )
}

function NodeComposer({ title }: { readonly title: string }) {
  return (
    <div style={{ flex: 'none', padding: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
      <form
        className="hd-composer"
        aria-label="Message this node"
        style={{
          padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-3)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <label className="hd-sr" htmlFor="workflow-run-node-message">
          Message this node
        </label>
        <textarea
          id="workflow-run-node-message"
          className="hd-composer__input"
          rows={1}
          placeholder="Message this node"
          disabled
          aria-disabled="true"
          aria-describedby={RUN_CALL_UNAVAILABLE_ID}
          style={{ minHeight: 24 }}
        />
        <button
          type="submit"
          className="hd-composer__send"
          aria-label={`Send to ${title}`}
          disabled
          aria-disabled="true"
          aria-describedby={RUN_CALL_UNAVAILABLE_ID}
          style={{ width: 28, height: 28 }}
        >
          <Icon name="arrow-up" />
        </button>
      </form>
    </div>
  )
}
