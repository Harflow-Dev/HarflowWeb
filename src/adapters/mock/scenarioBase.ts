import { asTaskId, type ContextLoad } from '../../model'
import { populatedComposer, populatedSidebar } from './fixtures'
import { populatedHarnessesLoad } from './harnessFixtures'
import { waitingNeedsYouLoad } from './needsYouFixtures'
import { populatedResourcesLoad } from './resourceFixtures'
import type {
  ScenarioDefinition,
  StatisticsScenario,
  TaskChangesScenario,
  TasksScenario,
} from './scenarios'
import { populatedWorkflowsLoad } from './workflowFixtures'

export function readyContext(sidebar = populatedSidebar()): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar,
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

export function base(
  partial: Omit<
    ScenarioDefinition,
    | 'workflows'
    | 'resources'
    | 'statistics'
    | 'tasks'
    | 'taskChanges'
    | 'harnesses'
    | 'needsYou'
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
        | 'needsYou'
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
    needsYou,
    ...partial,
  }
}
