import { useSyncExternalStore } from 'react'
import {
  MockBadge,
  ParallelGroupCancelDialog,
  PendingLaunchStopDialog,
  Sidebar,
  StatusRegion,
  TaskStopDialog,
  TaskTakeoverDialog,
} from '../components'
import { needsYouBadge } from '../model'
import {
  cancelAllDialogOpen,
  pendingLaunchesNavVisible,
  pendingStopDialogOpen,
  taskDialogView,
  type AppPresenter,
} from '../presentation'
import { mainLoadingLabel } from './mainLoadingLabel'
import { NeedsYouMain } from './NeedsYouMain'
import { NewTaskMain } from './NewTaskMain'
import { ParallelGroupMain } from './ParallelGroupMain'
import { PendingLaunchesMain } from './PendingLaunchesMain'
import { ResourcesMain } from './ResourcesMain'
import { SettingsMain } from './SettingsMain'
import { StatisticsMain } from './StatisticsMain'
import { TaskMain } from './TaskMain'
import { useEphemeralNote, usePresenter, usePresenterLifetime } from './usePresenter'
import { WorkflowRunMain } from './WorkflowRunMain'
import { WorkflowsMain } from './WorkflowsMain'

type Props = {
  readonly presenter: AppPresenter
}

type StatusNote = {
  readonly kind: 'unavailable' | 'announce'
  readonly text: string
}

export function AppFeature({ presenter }: Props) {
  usePresenterLifetime(presenter)
  const state = usePresenter(presenter)
  // One ephemeral note for both kinds: the newest replaces the other.
  const ephemeral = useEphemeralNote<StatusNote>()
  const systemDark = useSystemPrefersDark()
  const newTask = state.newTask
  const cancelAllOpen =
    state.route === 'parallel-group' && cancelAllDialogOpen(state.parallelGroup)
  const stopOpen =
    state.route === 'pending-launches' &&
    pendingStopDialogOpen(state.pendingLaunches)
  const taskDialog = state.route === 'task' ? taskDialogView(state.task) : null
  const dialogOpen = cancelAllOpen || stopOpen || taskDialog !== null
  const showPendingLaunches = pendingLaunchesNavVisible(state.pendingLaunches)

  const resolvedTheme =
    newTask.appearance === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : newTask.appearance

  const ready = newTask.context.kind === 'ready' ? newTask.context : null
  const listingLoading =
    newTask.context.kind === 'loading' ||
    ready?.sidebarListingLoading === true
  const contextNote =
    newTask.context.kind === 'unavailable'
      ? newTask.context.message
      : newTask.context.kind === 'loading'
        ? null
        : (ready?.sidebar.coverageNote ?? null)

  return (
    <div className="hw-root" data-theme={resolvedTheme}>
      <MockBadge />
      <div className="hd-app" data-theme={resolvedTheme}>
        <Sidebar
          collapsed={newTask.sidebarCollapsed}
          appearance={newTask.appearance}
          activeRoute={state.route}
          activeTaskId={state.task.selectedTaskId}
          activeParallelGroupId={state.parallelGroup.groupId}
          sidebar={ready?.sidebar ?? null}
          listingLoading={listingLoading}
          needsYou={needsYouBadge(state.needsYou.load)}
          needsYouLoading={state.needsYou.load.kind === 'loading'}
          onCollapse={(collapsed) => presenter.setSidebarCollapsed(collapsed)}
          onAppearance={(appearance) => presenter.setAppearance(appearance)}
          onNavigate={(route) => presenter.navigate(route)}
          onOpenTask={(taskId) => presenter.openTask(taskId)}
          onOpenParallelGroup={(groupId) => presenter.openParallelGroup(groupId)}
          onUnavailable={(label) => ephemeral.show({ kind: 'unavailable', text: label })}
          inert={dialogOpen}
          showPendingLaunches={showPendingLaunches}
        />
        <main className="hd-main" inert={dialogOpen || undefined}>
          {state.route === 'parallel-group' ? (
            <ParallelGroupMain
              state={state.parallelGroup}
              presenter={presenter}
            />
          ) : state.route === 'pending-launches' ? (
            <PendingLaunchesMain
              state={state.pendingLaunches}
              presenter={presenter}
            />
          ) : state.workflowExecution.runId !== null &&
            state.route === 'workflows' ? (
            <WorkflowRunMain
              state={state.workflowExecution}
              onSelectNode={(id) => presenter.selectWorkflowRunNode(id)}
              onViewMode={(mode) => presenter.setWorkflowRunViewMode(mode)}
            />
          ) : state.route === 'new-task' ? (
            <NewTaskMain presenter={presenter} state={newTask} />
          ) : state.route === 'workflows' ? (
            <WorkflowsMain
              state={state.workflows}
              onOpenRun={(id) => presenter.openWorkflowRun(id)}
              onCloseRun={() => presenter.closeWorkflowRun()}
              onTask={(task) => presenter.setWorkflowRunTask(task)}
              onGoal={(goal) => presenter.setWorkflowRunGoal(goal)}
              onGoalOpen={(open) => presenter.setWorkflowRunGoalOpen(open)}
              onRepository={(id) => presenter.selectWorkflowRunRepository(id)}
              onOverride={(id) => presenter.selectWorkflowRunOverride(id)}
              onUnavailable={(label) => ephemeral.show({ kind: 'unavailable', text: label })}
              editor={state.workflowEditor}
              onEdit={(id) => presenter.openWorkflowEditor(id)}
              onCloseEditor={() => presenter.closeWorkflowEditor()}
              onSelectNode={(id) => presenter.selectWorkflowNode(id)}
            />
          ) : state.route === 'resources' ? (
            <ResourcesMain
              state={state.resources}
              onUnavailable={(label) => ephemeral.show({ kind: 'unavailable', text: label })}
            />
          ) : state.route === 'statistics' ? (
            <StatisticsMain
              state={state.statistics}
              onSelectRange={(range) => presenter.selectStatisticsRange(range)}
            />
          ) : state.route === 'settings' ? (
            <SettingsMain
              section={state.settingsSection}
              onSection={(section) => presenter.selectSettingsSection(section)}
              appearance={newTask.appearance}
              onAppearance={(appearance) => presenter.setAppearance(appearance)}
              onUnavailable={(label) => ephemeral.show({ kind: 'unavailable', text: label })}
              general={state.settingsGeneral.load}
              harnesses={state.harnesses.load}
              expandedHarnessId={state.harnesses.expandedId}
              onExpandHarness={(id) => presenter.setExpandedHarness(id)}
            />
          ) : state.route === 'needs-you' ? (
            <NeedsYouMain
              state={state.needsYou}
              onOpenTask={(taskId) => presenter.openTask(taskId)}
              onOpenRun={(runId) => presenter.openWorkflowExecution(runId)}
            />
          ) : (
            <TaskMain
              state={state.task}
              sidebar={ready?.sidebar ?? null}
              onUnavailable={(label) => ephemeral.show({ kind: 'unavailable', text: label })}
              onAnnounce={(message) => ephemeral.show({ kind: 'announce', text: message })}
              onToggleChangesPane={(open) =>
                presenter.setTaskChangesPaneOpen(open)
              }
              onSelectChangedEntry={(entry) =>
                presenter.selectTaskChangedEntry(entry)
              }
              onSelectChangesTurn={(taskId) =>
                presenter.selectTaskChangesTurn(taskId)
              }
              onToggleChangesRepo={(root, expanded) =>
                presenter.setTaskRepositoryExpanded(root, expanded)
              }
              onToggleOverflowMenu={() =>
                presenter.setTaskOverflowMenuOpen(!state.task.overflowMenuOpen)
              }
              onCloseOverflowMenu={() =>
                presenter.setTaskOverflowMenuOpen(false)
              }
              onOpenDialog={(dialog, opener) =>
                presenter.openTaskDialog(dialog, opener)
              }
              onOpenParentTask={(taskId) => presenter.openTask(taskId)}
            />
          )}
        </main>
        {cancelAllOpen ? (
          <ParallelGroupCancelDialog
            onClose={() => presenter.setParallelGroupCancelAllConfirm(false)}
          />
        ) : null}
        {stopOpen && state.pendingLaunches.selectedLaunchId ? (
          <PendingLaunchStopDialog
            launchId={state.pendingLaunches.selectedLaunchId}
            onClose={() => presenter.setPendingLaunchStopConfirm(false)}
          />
        ) : null}
        {taskDialog?.kind === 'stop' ? (
          <TaskStopDialog
            wontBeStoppedTitles={taskDialog.wontBeStoppedTitles}
            onClose={() => presenter.closeTaskDialog()}
          />
        ) : null}
        {taskDialog?.kind === 'takeover' ? (
          <TaskTakeoverDialog
            accessLabel={taskDialog.accessLabel}
            onClose={() => presenter.closeTaskDialog()}
          />
        ) : null}
      </div>
      <StatusRegion
        submission={newTask.submission}
        contextNote={contextNote}
        unavailableNav={
          ephemeral.note?.kind === 'unavailable' ? ephemeral.note.text : null
        }
        announceNote={
          ephemeral.note?.kind === 'announce' ? ephemeral.note.text : null
        }
        noteNonce={ephemeral.nonce}
        loadingNote={mainLoadingLabel(state)}
      />
    </div>
  )
}

function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => undefined
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )
}
