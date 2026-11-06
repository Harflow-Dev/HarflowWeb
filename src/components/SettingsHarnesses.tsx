import { useState } from 'react'
import type {
  HarnessQualificationFact,
  HarnessUnavailableAction,
  HarnessesLoad,
  McpServerFact,
  SettingsHarnessFact,
} from '../model'
import {
  harnessInstallLabel,
  harnessQualificationLabel,
  harnessRegistrationLabel,
} from '../model'
import { Icon, type IconName } from './Icon'
import { McpApprovalsPanel, McpApprovalsToggle } from './SettingsMcpApprovals'

const UNAVAILABLE_ID = 'settings-harness-actions-unavailable'
export const HARNESS_ACTION_EXPLANATION =
  'Unavailable. This control does not install, register, refresh, remove, configure, or open an external destination.'

type Props = {
  readonly load: HarnessesLoad
}

/** Approved settings/harnesses composition. Mutations stay disabled. */
export function SettingsHarnesses({ load }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  if (load.kind === 'loading') {
    return <p role="status">Loading harness registration…</p>
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const { server, harnesses } = load.observation
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <p id={UNAVAILABLE_ID} className="hd-sr">
        {HARNESS_ACTION_EXPLANATION}
      </p>
      <ServerRow server={server} />
      <ul
        aria-label="Harness registration"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {harnesses.map((row) => (
          <li key={row.id}>
            <HarnessRule />
            <HarnessRow
              row={row}
              expanded={openId === row.id}
              onToggle={() =>
                setOpenId((current) => (current === row.id ? null : row.id))
              }
            />
            {openId === row.id && row.actions.includes('mcp-approvals') ? (
              <McpApprovalsPanel row={row} unavailableId={UNAVAILABLE_ID} />
            ) : null}
          </li>
        ))}
      </ul>
      <QualificationSection harnesses={harnesses} />
    </div>
  )
}

function ServerRow({ server }: { readonly server: McpServerFact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ServerCopy server={server} />
      </div>
      <UnavailableIconButton label="Refresh" icon="refresh" />
    </div>
  )
}

function ServerCopy({ server }: { readonly server: McpServerFact }) {
  if (server.kind === 'registered') {
    return (
      <>
        <div className="body" style={{ margin: 0 }}>
          Where Harflow is registered as an MCP server
        </div>
        <div className="caption hd-faint code" style={{ fontFamily: 'var(--font-mono)' }}>
          Server: {server.serverLabel}
        </div>
        <p className="caption hd-faint" style={{ margin: 0 }}>
          Fixture label. Not a path on this computer.
        </p>
      </>
    )
  }
  if (server.kind === 'not-registered') {
    return (
      <div className="body" style={{ margin: 0 }}>
        Harflow is not registered as an MCP server in this fixture.
      </div>
    )
  }
  return (
    <div className="body" style={{ margin: 0 }}>
      MCP server registration is unknown.
    </div>
  )
}

function HarnessRow({
  row,
  expanded,
  onToggle,
}: {
  readonly row: SettingsHarnessFact
  readonly expanded: boolean
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

function QualificationSection({
  harnesses,
}: {
  readonly harnesses: readonly SettingsHarnessFact[]
}) {
  return (
    <section
      aria-label="Harness qualification"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-4)',
      }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Harness qualification
      </h2>
      {harnesses.map((row) => (
        <div key={row.id} className="hd-form-row" style={{ minHeight: 28 }}>
          <span style={{ width: 180, flex: 'none', fontWeight: 500 }}>
            {row.label}
          </span>
          <QualificationFact fact={row.qualification} />
        </div>
      ))}
    </section>
  )
}

function QualificationFact({
  fact,
}: {
  readonly fact: HarnessQualificationFact
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flex: 1,
        color: 'var(--text-secondary)',
      }}
    >
      <QualificationMark fact={fact} />
      {harnessQualificationLabel(fact)}
    </span>
  )
}

function QualificationMark({
  fact,
}: {
  readonly fact: HarnessQualificationFact
}) {
  if (fact.kind === 'ready') {
    return (
      <span className="hd-glyph hd-glyph--done" aria-hidden="true">
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (fact.kind === 'attention') {
    return (
      <span className="hd-glyph hd-glyph--attention" aria-hidden="true">
        <Icon name="alert" size="sm" />
      </span>
    )
  }
  if (fact.kind === 'not-qualified') {
    return (
      <span className="hd-glyph hd-glyph--cancelled" aria-hidden="true">
        <Icon name="x" size="sm" />
      </span>
    )
  }
  return null
}

function UnavailableIconButton({
  label,
  icon,
}: {
  readonly label: string
  readonly icon: IconName
}) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--icon"
      aria-label={label}
      aria-disabled="true"
      aria-describedby={UNAVAILABLE_ID}
      disabled
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      <Icon name={icon} />
    </button>
  )
}

function UnavailableTextButton({
  action,
  harnessLabel,
}: {
  readonly action: HarnessUnavailableAction
  readonly harnessLabel: string
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
      aria-describedby={UNAVAILABLE_ID}
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
