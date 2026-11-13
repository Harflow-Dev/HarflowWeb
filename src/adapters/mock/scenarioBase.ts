import {
  asTaskId,
  type ComposerContext,
  type ContextLoad,
} from '../../model'
import { populatedComposer, populatedSidebar } from './fixtures'
import { populatedHarnessesLoad } from './harnessFixtures'
import { waitingNeedsYouLoad } from './needsYouFixtures'
import { populatedResourcesLoad } from './resourceFixtures'
import { populatedSettingsGeneralLoad } from './settingsGeneralFixtures'
import type {
  DeferredSurface,
  ScenarioDefinition,
  StatisticsScenario,
  TaskChangesScenario,
  TasksScenario,
} from './scenarios'
import { populatedWorkflowsLoad } from './workflowFixtures'

export function readyContext(
  sidebar = populatedSidebar(),
  options?: {
    readonly sidebarListingLoading?: boolean
  },
): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar,
    ...(options?.sidebarListingLoading === true
      ? { sidebarListingLoading: true }
      : {}),
  }
}

export const accepted = {
  kind: 'accepted' as const,
  taskId: asTaskId('task-mock-accepted'),
}

const resources = populatedResourcesLoad()
const workflows = populatedWorkflowsLoad()
const statistics: StatisticsScenario = 'default'
const tasks: TasksScenario = 'default'
const taskChanges: TaskChangesScenario = 'default'
const harnesses = populatedHarnessesLoad()
const needsYou = waitingNeedsYouLoad()
const settingsGeneral = populatedSettingsGeneralLoad()
const workflowEditors: DeferredSurface = 'default'
const workflowExecutions: DeferredSurface = 'default'
const parallelGroups: DeferredSurface = 'default'
const pendingLaunchCapability = false
const pendingLaunchInventory = 'default' as const
const pendingLaunchStatus = 'default' as const

export function base(
  partial: Omit<
    ScenarioDefinition,
    | 'workflows'
    | 'resources'
    | 'statistics'
    | 'tasks'
    | 'taskChanges'
    | 'harnesses'
    | 'settingsGeneral'
    | 'needsYou'
    | 'workflowEditors'
    | 'workflowExecutions'
    | 'parallelGroups'
    | 'pendingLaunchCapability'
    | 'pendingLaunchInventory'
    | 'pendingLaunchStatus'
  > &
    Partial<
      Pick<
        ScenarioDefinition,
        | 'workflows'
        | 'resources'
        | 'statistics'
        | 'tasks'
        | 'taskChanges'
        | 'harnesses'
        | 'settingsGeneral'
        | 'needsYou'
        | 'workflowEditors'
        | 'workflowExecutions'
        | 'parallelGroups'
        | 'pendingLaunchCapability'
        | 'pendingLaunchInventory'
        | 'pendingLaunchStatus'
        | 'seed'
      >
    >,
): ScenarioDefinition {
  return {
    workflows,
    resources,
    statistics,
    tasks,
    taskChanges,
    harnesses,
    settingsGeneral,
    needsYou,
    workflowEditors,
    workflowExecutions,
    parallelGroups,
    pendingLaunchCapability,
    pendingLaunchInventory,
    pendingLaunchStatus,
    ...partial,
  }
}

export function readyWithComposer(
  composer: ComposerContext,
  sidebar = populatedSidebar(),
): ContextLoad {
  return {
    kind: 'ready',
    composer,
    sidebar,
  }
}
