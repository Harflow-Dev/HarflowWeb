import { Icon, WorkflowRunForm, WorkflowsPage } from '../components'
import type {
  RepositoryId,
  WorkflowId,
  WorkflowOverrideId,
} from '../model'
import type { WorkflowsScreenState } from '../presentation'

type Props = {
  readonly state: WorkflowsScreenState
  readonly onOpenRun: (id: WorkflowId) => void
  readonly onCloseRun: () => void
  readonly onTask: (task: string) => void
  readonly onGoal: (goal: string) => void
  readonly onGoalOpen: (open: boolean) => void
  readonly onRepository: (id: RepositoryId) => void
  readonly onOverride: (id: WorkflowOverrideId) => void
  readonly onUnavailable: (label: string) => void
}

/** Workflow list, or the run form for one selected definition. */
export function WorkflowsMain({
  state,
  onOpenRun,
  onCloseRun,
  onTask,
  onGoal,
  onGoalOpen,
  onRepository,
  onOverride,
  onUnavailable,
}: Props) {
  const running = state.runWorkflowId !== null
  return (
    <>
      <div className="hd-topbar">
        {running ? (
          <button
            type="button"
            className="hd-btn hd-btn--ghost hd-btn--sm"
            onClick={onCloseRun}
          >
            <Icon name="arrow-left" size="sm" />
            Workflows
          </button>
        ) : null}
        <span className="hd-topbar__spacer" />
      </div>
      <div
        className="hd-scroll"
        style={
          running
            ? {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '96px var(--space-6) var(--space-6)',
              }
            : undefined
        }
      >
        <WorkflowBody
          state={state}
          onOpenRun={onOpenRun}
          onTask={onTask}
          onGoal={onGoal}
          onGoalOpen={onGoalOpen}
          onRepository={onRepository}
          onOverride={onOverride}
          onUnavailable={onUnavailable}
        />
      </div>
    </>
  )
}

function WorkflowBody({
  state,
  onOpenRun,
  onTask,
  onGoal,
  onGoalOpen,
  onRepository,
  onOverride,
  onUnavailable,
}: Omit<Props, 'onCloseRun'>) {
  if (state.runWorkflowId === null) {
    return state.load.kind === 'ready' ? (
      <WorkflowsPage
        workflows={state.load.workflows}
        onRun={onOpenRun}
        onUnavailable={onUnavailable}
      />
    ) : (
      <ListStatus state={state} />
    )
  }
  if (state.runContext.kind !== 'ready') {
    return (
      <p className="caption hd-faint" role="status">
        {state.runContext.kind === 'loading'
          ? 'Loading run context… (proposal — not a design-approved specimen)'
          : state.runContext.message}
      </p>
    )
  }
  const draft = state.drafts[state.runContext.context.workflowId]
  if (!draft) return null
  const workflows = state.load.kind === 'ready' ? state.load.workflows : []
  return (
    <WorkflowRunForm
      workflows={workflows}
      context={state.runContext.context}
      draft={draft}
      onOpen={onOpenRun}
      onTask={onTask}
      onGoal={onGoal}
      onGoalOpen={onGoalOpen}
      onRepository={onRepository}
      onOverride={onOverride}
    />
  )
}

function ListStatus({ state }: { readonly state: WorkflowsScreenState }) {
  return (
    <div className="hd-page">
      <div className="hd-page__head">
        <h1 className="hd-page__title">Workflows</h1>
      </div>
      <p className="caption hd-faint" role="status">
        {state.load.kind === 'loading'
          ? 'Loading workflows… (proposal — not a design-approved specimen)'
          : state.load.kind === 'unavailable'
            ? state.load.message
            : null}
      </p>
    </div>
  )
}
