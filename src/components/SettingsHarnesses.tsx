import { useState } from 'react'
import type { HarnessesLoad, McpServerFact } from '../model'
import { Icon, type IconName } from './Icon'
import { HarnessListItem } from './SettingsHarnessRow'
import { QualificationSection } from './SettingsHarnessQualification'

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
      <ServerRow server={server} unavailableId={UNAVAILABLE_ID} />
      <ul
        aria-label="Harness registration"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {harnesses.map((row) => (
          <HarnessListItem
            key={row.id}
            row={row}
            expanded={openId === row.id}
            unavailableId={UNAVAILABLE_ID}
            onToggle={() =>
              setOpenId((current) => (current === row.id ? null : row.id))
            }
          />
        ))}
      </ul>
      <QualificationSection harnesses={harnesses} />
    </div>
  )
}

function ServerRow({
  server,
  unavailableId,
}: {
  readonly server: McpServerFact
  readonly unavailableId: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ServerCopy server={server} />
      </div>
      <UnavailableIconButton
        label="Refresh"
        icon="refresh"
        unavailableId={unavailableId}
      />
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

function UnavailableIconButton({
  label,
  icon,
  unavailableId,
}: {
  readonly label: string
  readonly icon: IconName
  readonly unavailableId: string
}) {
  return (
    <button
      type="button"
      className="hd-btn hd-btn--icon"
      aria-label={label}
      aria-disabled="true"
      aria-describedby={unavailableId}
      disabled
      style={{ opacity: 0.45, cursor: 'default' }}
    >
      <Icon name={icon} />
    </button>
  )
}
