/**
 * M05 Events tab preview scenarios (Design 6e31cd7 EVENTS map).
 */
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import {
  TASK_EVENTS_EMPTY_ID,
  TASK_EVENTS_ERROR_ID,
  TASK_EVENTS_LOADING_ID,
  TASK_EVENTS_NOT_STARTED_ID,
  TASK_EVENTS_PAGE_ERROR_ID,
  TASK_EVENTS_PAGE_ID,
  TASK_EVENTS_POPULATED_ID,
} from './taskEventsFixtureIds'
import { taskLoadFor } from './taskFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

function eventsScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: string,
  extra?: {
    readonly taskEvents?: 'defer'
    readonly eventsChrome?: {
      readonly earlierLoaded?: boolean
      readonly earlierError?: boolean
    }
  },
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    tasks,
    ...(extra?.taskEvents !== undefined
      ? { taskEvents: extra.taskEvents }
      : {}),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId,
      eventsPaneOpen: true,
      paneTab: 'events',
      ...(extra?.eventsChrome !== undefined
        ? { eventsChrome: extra.eventsChrome }
        : {}),
    },
  })
}

export const TASK_EVENTS_LOADING_SCENARIO = eventsScenario(
  'task-events-loading',
  'Task Events loading',
  'Approved task/events-loading (M05). Deferred Events observation; pane open on Events.',
  TASK_EVENTS_LOADING_ID,
  { taskEvents: 'defer' },
)

export const TASK_EVENTS_SCENARIOS: readonly ScenarioDefinition[] = [
  eventsScenario(
    'task-events-populated',
    'Task Events populated',
    'Approved task/events-populated (M05). Notices 2, turns 3, facts and records.',
    TASK_EVENTS_POPULATED_ID,
  ),
  eventsScenario(
    'task-events-page',
    'Task Events page',
    'Approved task/events-page (M05). Load earlier adds a bounded page above the records.',
    TASK_EVENTS_PAGE_ID,
  ),
  eventsScenario(
    'task-events-page-error',
    'Task Events page error',
    "Approved task/events-page-error (M05). Loaded records stay; earlier read failed.",
    TASK_EVENTS_PAGE_ERROR_ID,
    { eventsChrome: { earlierError: true } },
  ),
  eventsScenario(
    'task-events-not-started',
    'Task Events not started',
    'Approved task/events-not-started (M05). Pending launch; every tab says the same.',
    TASK_EVENTS_NOT_STARTED_ID,
  ),
  TASK_EVENTS_LOADING_SCENARIO,
  eventsScenario(
    'task-events-empty',
    'Task Events empty',
    'Approved task/events-empty (M05). Empty window does not qualify totals.',
    TASK_EVENTS_EMPTY_ID,
  ),
  eventsScenario(
    'task-events-error',
    'Task Events error',
    'Approved task/events-error (M05). Captured history unavailable is not a task failure.',
    TASK_EVENTS_ERROR_ID,
  ),
]
