import type { WorkflowRunDraft } from '../model'
import { Icon } from './Icon'

const TASK_ERROR_ID = 'workflow-run-task-error'

export function WorkflowRunFields({
  draft,
  missing,
  onTask,
  onGoal,
  onGoalOpen,
}: {
  readonly draft: WorkflowRunDraft
  readonly missing: boolean
  readonly onTask: (task: string) => void
  readonly onGoal: (goal: string) => void
  readonly onGoalOpen: (open: boolean) => void
}) {
  return (
    <>
      <TaskField task={draft.task} missing={missing} onTask={onTask} />
      <GoalField draft={draft} onGoal={onGoal} onGoalOpen={onGoalOpen} />
    </>
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
