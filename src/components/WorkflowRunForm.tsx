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
import { WorkflowRunFields } from './WorkflowRunFields'
import { WorkflowRunMenus } from './WorkflowRunMenus'

export const WORKFLOW_RUN_EXPLANATION =
  'Unavailable. This does not run, save, delete, or edit the workflow.'

const SUBMIT_ID = 'workflow-run-submit-unavailable'

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
        <WorkflowRunFields
          draft={draft}
          missing={missing}
          onTask={onTask}
          onGoal={onGoal}
          onGoalOpen={onGoalOpen}
        />
        <div className="hd-composer__bar">
          <WorkflowRunMenus
            workflows={workflows}
            context={context}
            draft={draft}
            menu={menu}
            onOpen={onOpen}
            onRepository={onRepository}
            onOverride={onOverride}
            setMenu={setMenu}
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
