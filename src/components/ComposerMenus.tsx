import type {
  AccessLevel,
  AccessOption,
  HarnessId,
  HarnessOption,
  ModelId,
  RepositoryId,
  RepositoryOption,
} from '../model'
import { Icon } from './Icon'
import { PillMenu } from './PillMenu'

type RepoProps = {
  readonly open: boolean
  readonly repositories: readonly RepositoryOption[]
  readonly selectedRepositoryId: RepositoryId | null
  readonly disabled?: boolean
  readonly onToggle: () => void
  readonly onSelect: (id: RepositoryId) => void
}

export function RepositoryMenu(props: RepoProps) {
  const repo = props.repositories.find((r) => r.id === props.selectedRepositoryId)
  return (
    <PillMenu
      open={props.open}
      label={repo?.label ?? 'Repository'}
      icon="folder"
      menuLabel="Repository"
      disabled={props.disabled === true}
      onToggle={props.onToggle}
    >
      {props.repositories.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-menu__item"
          role="menuitem"
          onClick={() => props.onSelect(item.id)}
        >
          <Icon name="folder" />
          <span className="hd-menu__item-body">
            <span>{item.label}</span>
            <span className="hd-menu__item-hint">
              Server repository (mock) — not local filesystem access
            </span>
          </span>
          {item.id === props.selectedRepositoryId ? (
            <span className="hd-menu__check">
              <Icon name="check" />
            </span>
          ) : null}
        </button>
      ))}
    </PillMenu>
  )
}

type HarnessProps = {
  readonly open: boolean
  readonly harnesses: readonly HarnessOption[]
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly harnessMenuPhase: 'harness' | 'model'
  readonly disabled?: boolean
  readonly onToggle: () => void
  readonly onSelectHarness: (id: HarnessId) => void
  readonly onSelectModel: (id: ModelId) => void
}

export function HarnessMenu(props: HarnessProps) {
  const harness = props.harnesses.find((h) => h.id === props.selectedHarnessId)
  const model = harness?.models.find((m) => m.id === props.selectedModelId)
  const label =
    harness && model ? `${shortHarness(harness.label)} · ${model.label}` : 'Harness'
  return (
    <PillMenu
      open={props.open}
      label={label}
      icon="harness"
      menuLabel="Harness and model"
      disabled={props.disabled === true}
      onToggle={props.onToggle}
    >
      <div className="hd-menu__label">Harness</div>
      {props.harnesses.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-menu__item"
          role="menuitem"
          disabled={!item.available}
          aria-disabled={!item.available}
          style={item.available ? undefined : { opacity: 0.5, cursor: 'default' }}
          onClick={() => {
            if (item.available) props.onSelectHarness(item.id)
          }}
        >
          <Icon name="harness" />
          <span className="hd-menu__item-body">
            <span>{item.label}</span>
            <span className="hd-menu__item-hint">
              {item.available
                ? (item.models.find((m) => m.id === item.defaultModelId)?.label ??
                  'Default model')
                : (item.unavailableReason ?? 'Unavailable')}
            </span>
          </span>
          {item.id === props.selectedHarnessId ? (
            <span className="hd-menu__check">
              <Icon name="check" />
            </span>
          ) : null}
        </button>
      ))}
      {harness && props.harnessMenuPhase === 'model' ? (
        <>
          <div className="hd-menu__sep" />
          <div className="hd-menu__label">Model for {harness.label}</div>
          {harness.models.map((item) => (
            <button
              key={item.id}
              type="button"
              className="hd-menu__item"
              role="menuitem"
              onClick={() => props.onSelectModel(item.id)}
            >
              <span className="hd-menu__item-body">
                <span>{item.label}</span>
              </span>
              {item.id === props.selectedModelId ? (
                <span className="hd-menu__check">
                  <Icon name="check" />
                </span>
              ) : null}
            </button>
          ))}
        </>
      ) : null}
    </PillMenu>
  )
}

type AccessProps = {
  readonly open: boolean
  readonly accessOptions: readonly AccessOption[]
  readonly selectedAccess: AccessLevel
  readonly selectedHarnessId: HarnessId | null
  readonly harnesses: readonly HarnessOption[]
  readonly disabled?: boolean
  readonly onToggle: () => void
  readonly onSelect: (access: AccessLevel) => void
}

export function AccessMenu(props: AccessProps) {
  const harness = props.harnesses.find((h) => h.id === props.selectedHarnessId)
  const access = props.accessOptions.find((a) => a.id === props.selectedAccess)
  return (
    <PillMenu
      open={props.open}
      label={access?.label ?? 'Access'}
      icon="shield"
      menuLabel="Access level"
      disabled={props.disabled === true}
      onToggle={props.onToggle}
    >
      {props.accessOptions.map((item) => {
        const allowed =
          item.available &&
          (harness === undefined || harness.accessLevels.includes(item.id))
        return (
          <button
            key={item.id}
            type="button"
            className="hd-menu__item"
            role="menuitem"
            disabled={!allowed}
            aria-disabled={!allowed}
            style={allowed ? undefined : { opacity: 0.45, cursor: 'default' }}
            onClick={() => {
              if (allowed) props.onSelect(item.id)
            }}
          >
            <Icon name="shield" />
            <span className="hd-menu__item-body">
              <span>{item.label}</span>
              <span className="hd-menu__item-hint">
                {allowed
                  ? `${item.hint} (requested access — not enforced here)`
                  : 'Not available for this harness'}
              </span>
            </span>
            {item.id === props.selectedAccess ? (
              <span className="hd-menu__check">
                <Icon name="check" />
              </span>
            ) : null}
          </button>
        )
      })}
    </PillMenu>
  )
}

function shortHarness(label: string): string {
  if (label === 'Claude Code') return 'Claude'
  return label
}
