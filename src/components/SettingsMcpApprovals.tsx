import type { FormEvent } from 'react'
import type { SettingsHarnessFact } from '../model'
import { Icon } from './Icon'

const MISSING_COPY = 'MCP approvals for this harness are unavailable.'
const LIST_COPY = 'Global tool approvals apply across projects and future tasks.'
const EMPTY_COPY = 'No tool approvals are recorded for this harness.'
const HINT_COPY = 'Use server/* to approve every tool on one server.'

function mcpApprovalsPanelId(harnessId: string): string {
  return `mcp-approvals-${harnessId}`
}

type ToggleProps = {
  readonly harnessId: string
  readonly harnessLabel: string
  readonly expanded: boolean
  readonly onToggle: () => void
}

/** Disclosure for one harness. It does not change approvals. */
export function McpApprovalsToggle({
  harnessId,
  harnessLabel,
  expanded,
  onToggle,
}: ToggleProps) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--secondary"
      aria-expanded={expanded}
      aria-controls={mcpApprovalsPanelId(harnessId)}
      aria-label={`MCP approvals for ${harnessLabel}`}
      onClick={onToggle}
    >
      {expanded ? <Icon name="chevron-down" size="sm" /> : null}
      MCP approvals
    </button>
  )
}

type PanelProps = {
  readonly row: SettingsHarnessFact
  readonly unavailableId: string
}

/**
 * Inline settings/mcp-approvals list for the harness that owns the facts.
 * Missing or unknown facts stay an unavailable note.
 */
export function McpApprovalsPanel({ row, unavailableId }: PanelProps) {
  const approvals = row.approvals
  if (approvals === null || approvals.kind === 'unknown') {
    return <MissingApprovals row={row} />
  }
  return (
    <ListedApprovals
      row={row}
      entries={approvals.entries}
      unavailableId={unavailableId}
    />
  )
}

function MissingApprovals({ row }: { readonly row: SettingsHarnessFact }) {
  return (
    <div id={mcpApprovalsPanelId(row.id)} role="region" aria-label={regionName(row)} style={panelStyle}>
      <p className="caption hd-faint" role="status" style={{ margin: 0 }}>
        {MISSING_COPY}
      </p>
    </div>
  )
}

function ListedApprovals({
  row,
  entries,
  unavailableId,
}: {
  readonly row: SettingsHarnessFact
  readonly entries: readonly string[]
  readonly unavailableId: string
}) {
  const inputId = `mcp-new-${row.id}`
  const hintId = `mcp-hint-${row.id}`
  return (
    <div id={mcpApprovalsPanelId(row.id)} role="region" aria-label={regionName(row)} style={panelStyle}>
      <p className="caption hd-faint" style={{ margin: 0 }}>
        {LIST_COPY}
      </p>
      {entries.length === 0 ? (
        <p className="caption hd-faint" role="status" style={{ margin: 0 }}>
          {EMPTY_COPY}
        </p>
      ) : (
        entries.map((entry) => (
          <ApprovalRow key={entry} entry={entry} unavailableId={unavailableId} />
        ))
      )}
      <form
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          paddingLeft: 'var(--space-3)',
        }}
        onSubmit={keepList}
      >
        <div className="hd-field" style={{ flex: 1 }}>
          <label className="hd-sr" htmlFor={inputId}>
            Tool approval
          </label>
          <input
            id={inputId}
            className="hd-input"
            type="text"
            placeholder="server/tool"
            disabled
            readOnly
            aria-disabled="true"
            aria-describedby={`${hintId} ${unavailableId}`}
          />
          <span id={hintId} className="hd-field__hint">
            {HINT_COPY}
          </span>
        </div>
        <button
          type="submit"
          className="hd-btn hd-btn--secondary"
          disabled
          aria-disabled="true"
          aria-describedby={unavailableId}
          style={{ opacity: 0.45, cursor: 'default' }}
        >
          Add approval
        </button>
      </form>
    </div>
  )
}

function ApprovalRow({
  entry,
  unavailableId,
}: {
  readonly entry: string
  readonly unavailableId: string
}) {
  return (
    <div className="hd-form-row" style={{ minHeight: 36, paddingLeft: 'var(--space-3)' }}>
      <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
        {entry}
      </code>
      <button
        type="button"
        className="hd-btn hd-btn--ghost hd-btn--sm"
        aria-label={`Remove approval ${entry}`}
        disabled
        aria-disabled="true"
        aria-describedby={unavailableId}
        style={{ opacity: 0.45, cursor: 'default' }}
      >
        Remove
      </button>
    </div>
  )
}

function regionName(row: SettingsHarnessFact): string {
  return `MCP approvals for ${row.label}`
}

function keepList(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault()
}

const panelStyle = {
  marginLeft: 44,
  padding: 'var(--space-2) 0 var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
} as const
