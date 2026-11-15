/**
 * M05 G-ADAPTIVE pane layout and top-bar content scenarios (Design 40b8a19).
 */
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import {
  TASK_PANE_RUNNING_OPEN_ID,
  TASK_TOPBAR_FACTS_ID,
  TASK_TOPBAR_MINIMUM_ID,
  TASK_TOPBAR_RESOURCE_ID,
} from './taskPaneTopbarFixtures'
import {
  TASK_STATUS_FAILED_CONTINUE_ID,
  TASK_STATUS_RUNNING_STOP_ID,
} from './taskStatusFixtures'
import { TASK_CHANGES_SINGLE_ID } from './taskChangesFixtureIds'
import { taskLoadFor } from './taskFixtures'
import { QUEUE_SELECTED_CHROME } from './scenarioCatalogTaskChanges'

const tasks = (taskId: string) => taskLoadFor(taskId)

function paneScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: string,
  seed: NonNullable<ScenarioDefinition['seed']>,
  extra?: { readonly tasks?: 'defer' },
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    tasks: extra?.tasks === 'defer' ? 'defer' : tasks,
    startOutcome: accepted,
    holdStart: false,
    seed: { openTaskId, ...seed },
  })
}

export const TASK_PANE_TOPBAR_SCENARIOS: readonly ScenarioDefinition[] = [
  paneScenario(
    'pane-running-closed',
    'Task · Running · pane closed',
    'Approved task/pane-running-closed (M05). Running; pane closed by default.',
    TASK_STATUS_RUNNING_STOP_ID,
    {},
  ),
  paneScenario(
    'pane-running-open',
    'Task · Running · pane opened',
    'Approved task/pane-running-open (M05). First open lands on Events.',
    TASK_PANE_RUNNING_OPEN_ID,
    { eventsPaneOpen: true, paneTab: 'events' },
  ),
  paneScenario(
    'pane-failed-closed',
    'Task · Failed · pane closed',
    'Approved task/pane-failed-closed (M05). Failed; pane closed by default.',
    TASK_STATUS_FAILED_CONTINUE_ID,
    {},
  ),
  paneScenario(
    'pane-split',
    'Task · Pane beside the transcript',
    'Approved task/pane-split (M05). Split at 1280×800 detail width.',
    TASK_CHANGES_SINGLE_ID,
    { eventsPaneOpen: true, changesChrome: QUEUE_SELECTED_CHROME },
  ),
  paneScenario(
    'pane-overlay',
    'Task · Pane over the transcript',
    'Approved task/pane-overlay (M05). Overlay at 1000×620 detail width.',
    TASK_CHANGES_SINGLE_ID,
    {
      eventsPaneOpen: true,
      changesChrome: QUEUE_SELECTED_CHROME,
      frame: 'minimum',
    },
  ),
  paneScenario(
    'loading-pane',
    'Task · Loading with pane',
    'Approved task/loading-pane (M05). As task/loading plus pane; tab names real.',
    TASK_STATUS_RUNNING_STOP_ID,
    {
      eventsPaneOpen: true,
      openPaneWhileLoading: true,
      paneTab: 'events',
    },
    { tasks: 'defer' },
  ),
  paneScenario(
    'topbar-facts',
    'Task · Top bar · chips reach facts',
    'Approved task/topbar-facts (M05). Chips open Events facts groups.',
    TASK_TOPBAR_FACTS_ID,
    {
      eventsPaneOpen: true,
      paneTab: 'events',
      eventsFactsReveal: 'enforcement',
    },
  ),
  paneScenario(
    'topbar-resource',
    'Task · Top bar · resource context',
    'Approved task/topbar-resource (M05). Held resource card above the transcript.',
    TASK_TOPBAR_RESOURCE_ID,
    {},
  ),
  paneScenario(
    'topbar-minimum',
    'Task · Top bar · 1000 × 620',
    'Approved task/topbar-minimum (M05). Meta drops; chip labels compact.',
    TASK_TOPBAR_MINIMUM_ID,
    { frame: 'minimum' },
  ),
]
