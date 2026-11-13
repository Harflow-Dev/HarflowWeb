import type {
  LoadContextUseCase,
  LoadHarnessesUseCase,
  LoadNeedsYouUseCase,
  LoadParallelGroupUseCase,
  LoadPendingLaunchCapabilityUseCase,
  LoadPendingLaunchInventoryUseCase,
  LoadPendingLaunchStatusUseCase,
  LoadResourcesUseCase,
  LoadSettingsGeneralUseCase,
  LoadWorkflowEditorUseCase,
  LoadWorkflowExecutionUseCase,
  LoadWorkflowRunUseCase,
  LoadStatisticsUseCase,
  LoadTaskChangesUseCase,
  LoadTaskUseCase,
  LoadWorkflowsUseCase,
  StartTaskUseCase,
} from '../application'
import type { AppRoute, AppScreenState, SettingsSection } from './appState'
import { HarnessesSession } from './harnessesSession'
import { NeedsYouSession } from './needsYouSession'
import { ParallelGroupSession } from './parallelGroupSession'
import { PendingLaunchesSession } from './pendingLaunchesSession'
import { PresenterSession } from './presenterSession'
import { ResourcesSession } from './resourcesSession'
import { SettingsGeneralSession } from './settingsGeneralSession'
import { StatisticsSession } from './statisticsSession'
import { TaskSession } from './taskSession'
import { WorkflowEditorSession } from './workflowEditorSession'
import { WorkflowExecutionSession } from './workflowExecutionSession'
import { WorkflowsSession } from './workflowsSession'

export type AppSessionDeps = {
  readonly loadContext: LoadContextUseCase
  readonly startTask: StartTaskUseCase
  readonly loadWorkflows: LoadWorkflowsUseCase
  readonly loadResources: LoadResourcesUseCase
  readonly loadStatistics: LoadStatisticsUseCase
  readonly loadTask: LoadTaskUseCase
  readonly loadTaskChanges: LoadTaskChangesUseCase
  readonly loadHarnesses: LoadHarnessesUseCase
  readonly loadSettingsGeneral: LoadSettingsGeneralUseCase
  readonly loadNeedsYou: LoadNeedsYouUseCase
  readonly loadWorkflowRun: LoadWorkflowRunUseCase
  readonly loadWorkflowEditor: LoadWorkflowEditorUseCase
  readonly loadWorkflowExecution: LoadWorkflowExecutionUseCase
  readonly loadParallelGroup: LoadParallelGroupUseCase
  readonly loadPendingLaunchCapability: LoadPendingLaunchCapabilityUseCase
  readonly loadPendingLaunchInventory: LoadPendingLaunchInventoryUseCase
  readonly loadPendingLaunchStatus: LoadPendingLaunchStatusUseCase
}

export type AppChildSessions = {
  readonly newTask: PresenterSession
  readonly workflows: WorkflowsSession
  readonly resources: ResourcesSession
  readonly statistics: StatisticsSession
  readonly task: TaskSession
  readonly harnesses: HarnessesSession
  readonly settingsGeneral: SettingsGeneralSession
  readonly needsYou: NeedsYouSession
  readonly workflowEditor: WorkflowEditorSession
  readonly workflowExecution: WorkflowExecutionSession
  readonly parallelGroup: ParallelGroupSession
  readonly pendingLaunches: PendingLaunchesSession
}

export function createAppChildSessions(deps: AppSessionDeps): AppChildSessions {
  return {
    newTask: new PresenterSession({
      loadContext: deps.loadContext,
      startTask: deps.startTask,
    }),
    workflows: new WorkflowsSession(deps.loadWorkflows, deps.loadWorkflowRun),
    resources: new ResourcesSession(deps.loadResources),
    statistics: new StatisticsSession(deps.loadStatistics),
    task: new TaskSession(deps.loadTask, deps.loadTaskChanges),
    harnesses: new HarnessesSession(deps.loadHarnesses),
    settingsGeneral: new SettingsGeneralSession(deps.loadSettingsGeneral),
    needsYou: new NeedsYouSession(deps.loadNeedsYou),
    workflowEditor: new WorkflowEditorSession(deps.loadWorkflowEditor),
    workflowExecution: new WorkflowExecutionSession(deps.loadWorkflowExecution),
    parallelGroup: new ParallelGroupSession(deps.loadParallelGroup),
    pendingLaunches: new PendingLaunchesSession(
      deps.loadPendingLaunchCapability,
      deps.loadPendingLaunchInventory,
      deps.loadPendingLaunchStatus,
    ),
  }
}

export function subscribeAppChildSessions(
  children: AppChildSessions,
  onChange: () => void,
): void {
  children.newTask.subscribe(onChange)
  children.workflows.subscribe(onChange)
  children.resources.subscribe(onChange)
  children.statistics.subscribe(onChange)
  children.task.subscribe(onChange)
  children.harnesses.subscribe(onChange)
  children.settingsGeneral.subscribe(onChange)
  children.needsYou.subscribe(onChange)
  children.workflowEditor.subscribe(onChange)
  children.workflowExecution.subscribe(onChange)
  children.parallelGroup.subscribe(onChange)
  children.pendingLaunches.subscribe(onChange)
}

export function startAppChildSessions(children: AppChildSessions): void {
  children.newTask.start()
  children.workflows.start()
  children.resources.start()
  children.statistics.start()
  children.task.start()
  children.harnesses.start()
  children.settingsGeneral.start()
  children.needsYou.start()
  children.workflowEditor.start()
  children.workflowExecution.start()
  children.parallelGroup.start()
  children.pendingLaunches.start()
}

export function disposeAppChildSessions(children: AppChildSessions): void {
  children.newTask.dispose()
  children.workflows.dispose()
  children.resources.dispose()
  children.statistics.dispose()
  children.task.dispose()
  children.harnesses.dispose()
  children.settingsGeneral.dispose()
  children.needsYou.dispose()
  children.workflowEditor.dispose()
  children.workflowExecution.dispose()
  children.parallelGroup.dispose()
  children.pendingLaunches.dispose()
}

export function buildAppSnapshot(
  route: AppRoute,
  settingsSection: SettingsSection,
  children: AppChildSessions,
): AppScreenState {
  return {
    route,
    newTask: children.newTask.getState(),
    workflows: children.workflows.getState(),
    resources: children.resources.getState(),
    statistics: children.statistics.getState(),
    task: children.task.getState(),
    settingsSection,
    settingsGeneral: children.settingsGeneral.getState(),
    harnesses: children.harnesses.getState(),
    needsYou: children.needsYou.getState(),
    workflowEditor: children.workflowEditor.getState(),
    workflowExecution: children.workflowExecution.getState(),
    parallelGroup: children.parallelGroup.getState(),
    pendingLaunches: children.pendingLaunches.getState(),
  }
}
