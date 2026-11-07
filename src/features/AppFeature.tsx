import { useSyncExternalStore } from 'react'
import { MockBadge, Sidebar, StatusRegion } from '../components'
import { needsYouBadge } from '../model'
import type { AppPresenter } from '../presentation'
import { NeedsYouMain } from './NeedsYouMain'
import { NewTaskMain } from './NewTaskMain'
import { ParallelGroupMain } from './ParallelGroupMain'
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

export function AppFeature({ presenter }: Props) {
  usePresenterLifetime(presenter)
  const state = usePresenter(presenter)
  const ephemeral = useEphemeralNote()
  const systemDark = useSystemPrefersDark()
  const newTask = state.newTask

  const resolvedTheme =
    newTask.appearance === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : newTask.appearance

  const ready = newTask.context.kind === 'ready' ? newTask.context : null
  const contextNote =
    newTask.context.kind === 'unavailable'
      ? newTask.context.message
      : newTask.context.kind === 'loading'
        ? 'Loading composer context… (proposal — not a design-approved specimen)'
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
          needsYou={needsYouBadge(state.needsYou.load)}
          onCollapse={(collapsed) => presenter.setSidebarCollapsed(collapsed)}
          onAppearance={(appearance) => presenter.setAppearance(appearance)}
          onNavigate={(route) => presenter.navigate(route)}
          onOpenTask={(taskId) => presenter.openTask(taskId)}
          onOpenParallelGroup={(groupId) => presenter.openParallelGroup(groupId)}
          onUnavailable={(label) => ephemeral.show(label)}
        />
        <main className="hd-main">
          {state.route === 'parallel-group' ? (
            <ParallelGroupMain state={state.parallelGroup} />
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
              onUnavailable={(label) => ephemeral.show(label)}
              editor={state.workflowEditor}
              onEdit={(id) => presenter.openWorkflowEditor(id)}
              onCloseEditor={() => presenter.closeWorkflowEditor()}
              onSelectNode={(id) => presenter.selectWorkflowNode(id)}
            />
          ) : state.route === 'resources' ? (
            <ResourcesMain
              state={state.resources}
              onUnavailable={(label) => ephemeral.show(label)}
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
              onUnavailable={(label) => ephemeral.show(label)}
              harnesses={state.harnesses.load}
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
              onUnavailable={(label) => ephemeral.show(label)}
              onToggleChangesPane={(open) =>
                presenter.setTaskChangesPaneOpen(open)
              }
              onSelectChangedFile={(path) =>
                presenter.selectTaskChangedFile(path)
              }
            />
          )}
        </main>
      </div>
      <StatusRegion
        submission={newTask.submission}
        contextNote={contextNote}
        unavailableNav={ephemeral.note}
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
