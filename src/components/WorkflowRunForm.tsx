import { useState } from 'react'
import type {
  RepositoryId,
  WorkflowId,
  WorkflowOverrideId,
  WorkflowRunContext,
  WorkflowRunDraft,
  WorkflowSummary,
} from '../model'
import {
  workflowPermissionFacts,
  workflowPermissionLine,
  workflowTaskMissing,
} from '../model'
import { Icon } from './Icon'
import { PillMenu } from './PillMenu'
import { RepositoryMenu } from './ComposerMenus'

export const WORKFLOW_RUN_EXPLANATION =
  'Unavailable. This does not run, save, delete, or edit the workflow.'

const SUBMIT_ID = 'workflow-run-submit-unavailable'
const TASK_ERROR_ID = 'workflow-run-task-error'
const OVERRIDE_HELP_ID = 'workflow-run-override-unavailable'

type MenuName = 'workflow' | 'repository' | 'override'

type Props = {
  readonly workflows: readonly WorkflowSummary[]
  readonly context: WorkflowRunContext
  readonly draft: WorkflowRunDraft
  readonly onOpen: (id: WorkflowId) => void
  readonly onTask: (task: string) => void
  readonly onGoal: (goal: string) => void
  readonly onGoalOpen: (open: boolean) => void
  readonly onRepository: (id: RepositoryId) => void
  readonly onOverride: (id: WorkflowOverrideId) => void
}

/** Approved workflows/run composition. Final Run stays unavailable. */
export function WorkflowRunForm({
  workflows,
  context,
  draft,
  onOpen,
  onTask,
  onGoal,
  onGoalOpen,
  onRepository,
  onOverride,
}: Props) {
  const [menu, setMenu] = useState<MenuName | null>(null)
  const missing = draft.seeded && workflowTaskMissing(draft.task)
  const facts = workflowPermissionFacts(
    context,
    draft.repositoryId,
    draft.overrideId,
  )
  const toggle = (name: MenuName) => setMenu((open) => (open === name ? null : name))

  return (
    <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <h1 className="display" style={{ margin: 0, textAlign: 'center' }}>
        Run {context.title}
      </h1>
      <form
        className="hd-composer"
        aria-label="Run workflow"
        onSubmit={(event) => event.preventDefault()}
      >
        <TaskField task={draft.task} missing={missing} onTask={onTask} />
        <GoalField draft={draft} onGoal={onGoal} onGoalOpen={onGoalOpen} />
        <div className="hd-composer__bar">
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
          <span className="hd-composer__spacer" />
          <button
            type="submit"
            className="hd-composer__send"
            aria-label="Run workflow"
            disabled
            aria-disabled="true"
            aria-describedby={SUBMIT_ID}
          >
            <Icon name="play" />
          </button>
        </div>
      </form>
      <p id={SUBMIT_ID} className="hd-sr">
        {WORKFLOW_RUN_EXPLANATION}
      </p>
      <Permissions facts={facts} />
    </div>
  )
}

function TaskField({
  task,
  missing,
  onTask,
}: {
  readonly task: string
  readonly missing: boolean
  readonly onTask: (task: string) => void
}) {
  return (
    <div className="hd-field">
      <label className="hd-field__label" htmlFor="workflow-run-task">
        Task <span className="hd-faint" style={{ fontWeight: 400 }}>Required</span>
      </label>
      <textarea
        id="workflow-run-task"
        className="hd-composer__input"
        rows={3}
        placeholder="What should this run do?"
        value={task}
        aria-invalid={missing}
        aria-describedby={missing ? TASK_ERROR_ID : undefined}
        onChange={(event) => onTask(event.target.value)}
      />
      {missing ? (
        <span id={TASK_ERROR_ID} className="hd-field__error" role="alert">
          Task is required.
        </span>
      ) : null}
    </div>
  )
}

function GoalField({
  draft,
  onGoal,
  onGoalOpen,
}: {
  readonly draft: WorkflowRunDraft
  readonly onGoal: (goal: string) => void
  readonly onGoalOpen: (open: boolean) => void
}) {
  return (
    <div className="hd-field" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-2)' }}>
      <button
        id="workflow-goal-toggle"
        type="button"
        aria-expanded={draft.goalOpen}
        aria-controls="workflow-goal-panel"
        className="hd-row"
        style={{
          border: 0,
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 12,
          lineHeight: '16px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          gap: 4,
        }}
        onClick={() => onGoalOpen(!draft.goalOpen)}
      >
        <Icon name={draft.goalOpen ? 'chevron-down' : 'chevron-right'} size="sm" />
        Goal (optional)
      </button>
      {draft.goalOpen ? (
        <div id="workflow-goal-panel" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="hd-sr" htmlFor="workflow-run-goal">
            Goal
          </label>
          <textarea
            id="workflow-run-goal"
            className="hd-composer__input"
            rows={2}
            style={{ minHeight: 44 }}
            value={draft.goal}
            onChange={(event) => onGoal(event.target.value)}
          />
          <span className="hd-field__hint">
            Describe the result and the evidence needed to verify it.
          </span>
        </div>
      ) : null}
    </div>
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

function Permissions({
  facts,
}: {
  readonly facts: ReturnType<typeof workflowPermissionFacts>
}) {
  return (
    <section aria-label="Permissions preview" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: '0 var(--space-2)' }}>
      <span className="caption hd-faint">This run will use</span>
      {facts === null ? (
        <p className="caption" role="status">
          Permissions for this choice are unavailable.
        </p>
      ) : (
        facts.map((fact) => (
          <div key={fact.id} className="hd-row caption hd-muted" style={{ flexWrap: 'nowrap', gap: 'var(--space-2)' }}>
            <Icon name="harness" size="sm" />
            <span>{workflowPermissionLine(fact)}</span>
          </div>
        ))
      )}
      <p className="caption hd-faint" style={{ margin: 0 }}>
        Fixture preview. These labels are not installed or qualified backends,
        and they do not claim enforcement.
      </p>
    </section>
  )
}
