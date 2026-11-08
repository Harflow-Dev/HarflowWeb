import type { HarnessUnavailableAction, SettingsHarnessFact } from '../model'
import { harnessInstallLabel, harnessRegistrationLabel } from '../model'
import { Icon, type IconName } from './Icon'
import { McpApprovalsPanel, McpApprovalsToggle } from './SettingsMcpApprovals'

export function HarnessListItem({
  row,
  expanded,
  unavailableId,
  onToggle,
}: {
  readonly row: SettingsHarnessFact
  readonly expanded: boolean
  readonly unavailableId: string
  readonly onToggle: () => void
}) {
  return (
    <li>
      <HarnessRule />
      <HarnessRow
        row={row}
        expanded={expanded}
        unavailableId={unavailableId}
        onToggle={onToggle}
      />
      {expanded && row.actions.includes('mcp-approvals') ? (
        <McpApprovalsPanel row={row} unavailableId={unavailableId} />
      ) : null}
    </li>
  )
}

function HarnessRow({
  row,
  expanded,
  unavailableId,
  onToggle,
}: {
  readonly row: SettingsHarnessFact
  readonly expanded: boolean
  readonly unavailableId: string
  readonly onToggle: () => void
}) {
  return (
    <div className="hd-form-row" style={{ minHeight: 44 }}>
      <span className="hd-list-row__icon" style={{ flex: 'none' }}>
        <Icon name="harness" />
      </span>
      <div className="hd-form-row__label">
        <span style={{ fontWeight: 500 }}>{row.label}</span>
        <span className="hd-form-row__hint">
          {harnessRegistrationLabel(row.registration)}
          {row.hint ? `. ${row.hint}` : ''}
        </span>
      </div>
      <InstallBadge row={row} />
      <span
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          justifyContent: 'flex-end',
          width: 190,
          flex: 'none',
        }}
      >
        {row.actions.map((action) =>
          action === 'mcp-approvals' ? (
            <McpApprovalsToggle
              key={action}
              harnessId={row.id}
              harnessLabel={row.label}
              expanded={expanded}
              onToggle={onToggle}
            />
          ) : (
            <UnavailableTextButton
              key={action}
              action={action}
              harnessLabel={row.label}
              unavailableId={unavailableId}
            />
          ),
        )}
      </span>
    </div>
  )
}

function InstallBadge({ row }: { readonly row: SettingsHarnessFact }) {
  const label = harnessInstallLabel(row.install)
  const tone =
    row.install.kind === 'installed'
      ? 'hd-badge hd-badge--done'
      : row.install.kind === 'update-available'
        ? 'hd-badge hd-badge--warning'
        : 'hd-badge'
  const icon = installIcon(row.install.kind)
  return (
    <span style={{ width: 150, flex: 'none' }}>
      <span className={tone}>
        {icon ? <Icon name={icon} size="sm" /> : null}
        {label}
      </span>
    </span>
  )
}

function installIcon(
  kind: SettingsHarnessFact['install']['kind'],
): IconName | null {
  switch (kind) {
    case 'installed':
      return 'check'
    case 'update-available':
      return 'alert'
    case 'not-found':
      return 'x'
    case 'unknown':
      return null
  }
}

function UnavailableTextButton({
  action,
  harnessLabel,
  unavailableId,
}: {
  readonly action: HarnessUnavailableAction
  readonly harnessLabel: string
  readonly unavailableId: string
}) {
  const visible = actionVisible(action)
  const tone =
    action === 'remove' ? 'hd-btn hd-btn--ghost' : 'hd-btn hd-btn--secondary'
  return (
    <button
      type="button"
      className={tone}
      aria-label={actionName(action, harnessLabel)}
      aria-disabled="true"
      aria-describedby={unavailableId}
      disabled
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      {visible}
    </button>
  )
}

function actionVisible(action: HarnessUnavailableAction): string {
  switch (action) {
    case 'mcp-approvals':
      return 'MCP approvals'
    case 'remove':
      return 'Remove'
    case 'update':
      return 'Update'
  }
}

function actionName(action: HarnessUnavailableAction, harness: string): string {
  switch (action) {
    case 'mcp-approvals':
      return `MCP approvals for ${harness}`
    case 'remove':
      return `Remove ${harness}`
    case 'update':
      return `Update ${harness}`
  }
}

function HarnessRule() {
  return (
    <hr
      style={{
        border: 0,
        borderTop: '1px solid var(--border)',
        margin: 0,
      }}
    />
  )
}
