import type { WorkflowRunDetail as Detail, WorkflowRunTool } from '../model'
import { Icon } from './Icon'
import { RUN_UNAVAILABLE_ID } from './workflowRunUnavailable'

type Props = {
  readonly detail: Detail
}

/** Selected Open pull request pane. Approve, reject, and goal edits stay disabled. */
export function WorkflowRunDetail({ detail }: Props) {
  return (
    <aside className="hd-pane" style={{ width: 460 }} aria-label="Selected step">
      <div className="hd-pane__head">
        <span className="hd-topbar__title">{detail.title}</span>
        <span className="hd-badge hd-badge--attention">
          <Icon name="hand" size="sm" />
          {detail.statusLabel}
        </span>
        <span className="hd-topbar__spacer" />
      </div>
      <div
        className="hd-scroll hd-thin-scroll"
        style={{
          padding: 'var(--space-4) var(--space-4) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <Goal detail={detail} />
        <div className="caption hd-faint">{detail.agent}</div>
        <div className="hd-msg-agent">
          <p>{detail.message}</p>
        </div>
        {detail.tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
        <Approval detail={detail} />
      </div>
    </aside>
  )
}

function Goal({ detail }: { readonly detail: Detail }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span className="hd-inspector__label">GOAL</span>
      <p className="body" style={{ margin: 0 }}>
        {detail.goal}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        <Icon name="target" size="sm" />
        <span>{detail.assessment}</span>
      </div>
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-describedby={RUN_UNAVAILABLE_ID}
        style={{
          fontSize: 13,
          color: 'var(--accent)',
          background: 'none',
          border: 0,
          padding: 0,
          textAlign: 'left',
          opacity: 0.45,
          cursor: 'default',
        }}
      >
        Revise goal…
      </button>
    </div>
  )
}

function ToolRow({ tool }: { readonly tool: WorkflowRunTool }) {
  const open = tool.output !== null
  return (
    <div className="hd-tool">
      <button
        type="button"
        className="hd-tool__head"
        disabled
        aria-disabled="true"
        aria-expanded={open}
        aria-describedby={RUN_UNAVAILABLE_ID}
      >
        <Icon name="terminal" size="sm" />
        <span className="hd-tool__summary">
          Ran <code>{tool.summary}</code>
        </span>
        <span className="hd-tool__meta">{tool.duration}</span>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size="sm" />
      </button>
      {tool.output ? <div className="hd-tool__body">{tool.output}</div> : null}
    </div>
  )
}

function Approval({ detail }: { readonly detail: Detail }) {
  const approval = detail.approval
  return (
    <div className="hd-approval" role="group" aria-label="Approval needed" style={{ flex: 'none' }}>
      <div className="hd-approval__head">
        <Icon name="hand" size="sm" />
        <span>{approval.title}</span>
        <span className="hd-approval__src">{approval.source}</span>
      </div>
      <div className="hd-approval__body">
        <p style={{ margin: 0, fontSize: 13, lineHeight: '20px' }}>{approval.body}</p>
        <div className="hd-approval__cmd">{approval.command}</div>
        <div className="hd-approval__meta">{approval.access}</div>
      </div>
      <div className="hd-approval__actions">
        <DisabledAction label="Approve" tone="hd-btn hd-btn--primary" />
        <DisabledAction label="Reject" tone="hd-btn hd-btn--ghost" />
      </div>
    </div>
  )
}

function DisabledAction({ label, tone }: { readonly label: string; readonly tone: string }) {
  return (
    <button
      type="button"
      className={tone}
      disabled
      aria-disabled="true"
      aria-describedby={RUN_UNAVAILABLE_ID}
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      {label}
    </button>
  )
}
