import type { Dispatch, SetStateAction } from 'react'
import type {
  RepositoryId,
  WorkflowId,
  WorkflowOverrideId,
  WorkflowRunContext,
  WorkflowRunDraft,
  WorkflowSummary,
} from '../model'
import { Icon } from './Icon'
import { PillMenu } from './PillMenu'
import { RepositoryMenu } from './ComposerMenus'

const OVERRIDE_HELP_ID = 'workflow-run-override-unavailable'

type MenuName = 'workflow' | 'repository' | 'override'

export function WorkflowRunMenus({
  workflows,
  context,
  draft,
  menu,
  onOpen,
  onRepository,
  onOverride,
  setMenu,
}: {
  readonly workflows: readonly WorkflowSummary[]
  readonly context: WorkflowRunContext
  readonly draft: WorkflowRunDraft
  readonly menu: MenuName | null
  readonly onOpen: (id: WorkflowId) => void
  readonly onRepository: (id: RepositoryId) => void
  readonly onOverride: (id: WorkflowOverrideId) => void
  readonly setMenu: Dispatch<SetStateAction<MenuName | null>>
}) {
  const toggle = (name: MenuName) => setMenu((open) => (open === name ? null : name))
  return (
    <>
      <WorkflowMenu
        workflows={workflows}
        title={context.title}
        open={menu === 'workflow'}
        onToggle={() => toggle('workflow')}
        onOpen={onOpen}
      />
      <RepositoryMenu
        open={menu === 'repository'}
        repositories={context.repositories}
        selectedRepositoryId={draft.repositoryId}
        onToggle={() => toggle('repository')}
        onSelect={(id) => {
          onRepository(id)
          setMenu(null)
        }}
      />
      <OverrideMenu
        context={context}
        draft={draft}
        open={menu === 'override'}
        onToggle={() => toggle('override')}
        onOverride={(id) => {
          onOverride(id)
          setMenu(null)
        }}
      />
    </>
  )
}

function WorkflowMenu({
  workflows,
  title,
  open,
  onToggle,
  onOpen,
}: {
  readonly workflows: readonly WorkflowSummary[]
  readonly title: string
  readonly open: boolean
  readonly onToggle: () => void
  readonly onOpen: (id: WorkflowId) => void
}) {
  return (
    <PillMenu
      open={open}
      label={title}
      icon="workflow"
      accent
      menuLabel="Workflow"
      onToggle={onToggle}
    >
      {workflows.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-menu__item"
          role="menuitem"
          onClick={() => onOpen(item.id)}
        >
          <Icon name="workflow" />
          <span className="hd-menu__item-body">
            <span>{item.title}</span>
          </span>
          {item.title === title ? (
            <span className="hd-menu__check">
              <Icon name="check" />
            </span>
          ) : null}
        </button>
      ))}
    </PillMenu>
  )
}

function OverrideMenu({
  context,
  draft,
  open,
  onToggle,
  onOverride,
}: {
  readonly context: WorkflowRunContext
  readonly draft: WorkflowRunDraft
  readonly open: boolean
  readonly onToggle: () => void
  readonly onOverride: (id: WorkflowOverrideId) => void
}) {
  const selected = context.overrides.find((item) => item.id === draft.overrideId)
  return (
    <PillMenu
      open={open}
      label={selected?.label ?? 'Orchestrator'}
      icon="harness"
      menuLabel="Orchestrator override"
      onToggle={onToggle}
    >
      <p id={OVERRIDE_HELP_ID} className="hd-sr">
        Unsupported. This does not replace the saved orchestrator.
      </p>
      {context.overrides.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-menu__item"
          role="menuitem"
          disabled={!item.available}
          aria-disabled={!item.available}
          aria-describedby={item.available ? undefined : OVERRIDE_HELP_ID}
          style={item.available ? undefined : { opacity: 0.5, cursor: 'default' }}
          onClick={() => {
            if (item.available) onOverride(item.id)
          }}
        >
          <Icon name="harness" />
          <span className="hd-menu__item-body">
            <span>{item.label}</span>
            {item.unavailableReason ? (
              <span className="hd-menu__item-hint">{item.unavailableReason}</span>
            ) : null}
          </span>
          {item.id === draft.overrideId ? (
            <span className="hd-menu__check">
              <Icon name="check" />
            </span>
          ) : null}
        </button>
      ))}
    </PillMenu>
  )
}
