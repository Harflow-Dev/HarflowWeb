/**
 * M05 G-DIFF preview scenarios (Design 6e31cd7).
 */
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import type { TaskChangesChromeSeed } from './scenarioSeed'
import {
  BIG_MODULE_ENTRY,
  HARFLOW_MCP_ROOT,
  QUEUE_ENTRY,
  SAME_PATH_WORKING,
  textSpecimenPanels,
  turnsMembers,
} from './taskChangesFixtures'
import {
  TASK_CHANGES_ERROR_ID,
  TASK_CHANGES_INCOMPLETE_ID,
  TASK_CHANGES_LOADING_ID,
  TASK_CHANGES_MULTI_ID,
  TASK_CHANGES_MULTI_LIMITED_ID,
  TASK_CHANGES_NOT_CAPTURED_ID,
  TASK_CHANGES_NO_REPOSITORY_ID,
  TASK_CHANGES_ROW_STATES_ID,
  TASK_CHANGES_RUNNING_ID,
  TASK_CHANGES_SAME_PATH_ID,
  TASK_CHANGES_SINGLE_ID,
  TASK_CHANGES_TEXT_ID,
  TASK_CHANGES_TURNS_ID,
  TASK_CHANGES_UNMERGED_ID,
  TASK_CHANGES_ZERO_ID,
} from './taskChangesFixtureIds'
import { taskLoadFor } from './taskFixtures'

const tasks = (taskId: string) => taskLoadFor(taskId)

const VENDORED_TOOLS_ROOT = '~/Code/vendored-tools'

function changesScenario(
  id: ScenarioDefinition['id'],
  label: string,
  description: string,
  openTaskId: string,
  extra?: {
    readonly taskChanges?: 'defer'
    readonly changesChrome?: TaskChangesChromeSeed
  },
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    tasks,
    ...(extra?.taskChanges !== undefined
      ? { taskChanges: extra.taskChanges }
      : {}),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId,
      eventsPaneOpen: true,
      ...(extra?.changesChrome !== undefined
        ? { changesChrome: extra.changesChrome }
        : {}),
    },
  })
}

/** Chrome that selects queue.py, as the design's single state draws it. */
export const QUEUE_SELECTED_CHROME: TaskChangesChromeSeed = {
  selectedEntry: QUEUE_ENTRY,
}

export const TASK_CHANGES_LOADING_SCENARIO = changesScenario(
  'task-changes-loading',
  'Task Changes loading',
  'Approved task/changes-loading (M05). Deferred Changes observation; pane open.',
  TASK_CHANGES_LOADING_ID,
  { taskChanges: 'defer' },
)

export const TASK_CHANGES_SCENARIOS: readonly ScenarioDefinition[] = [
  changesScenario(
    'task-changes-single',
    'Task · Changes · one repository',
    'Approved task/changes-single (M05 G-DIFF). Repository, then scope, then rows.',
    TASK_CHANGES_SINGLE_ID,
    { changesChrome: { selectedEntry: QUEUE_ENTRY } },
  ),
  changesScenario(
    'task-changes-multi',
    'Task · Changes · 8 repositories',
    'Approved task/changes-multi (M05 G-DIFF). First repository expanded.',
    TASK_CHANGES_MULTI_ID,
    { changesChrome: { expandedRepos: [HARFLOW_MCP_ROOT] } },
  ),
  changesScenario(
    'task-changes-multi-limited',
    'Task · Changes · limited repositories',
    'Approved task/changes-multi-limited (M05 G-DIFF). One limited repository removes the tab count.',
    TASK_CHANGES_MULTI_LIMITED_ID,
  ),
  changesScenario(
    'task-changes-same-path',
    'Task · Changes · same path',
    'Approved task/changes-same-path (M05 G-DIFF). Two rows, never merged.',
    TASK_CHANGES_SAME_PATH_ID,
    { changesChrome: { selectedEntry: SAME_PATH_WORKING } },
  ),
  changesScenario(
    'task-changes-row-states',
    'Task · Changes · row states',
    'Approved task/changes-row-states (M05 G-DIFF). Truncated, binary, omitted, not captured.',
    TASK_CHANGES_ROW_STATES_ID,
    { changesChrome: { selectedEntry: BIG_MODULE_ENTRY } },
  ),
  changesScenario(
    'task-changes-incomplete',
    'Task · Changes · incomplete',
    'Approved task/changes-incomplete (M05 G-DIFF). Rows read so far stay.',
    TASK_CHANGES_INCOMPLETE_ID,
  ),
  changesScenario(
    'task-changes-not-captured',
    'Task · Changes · not captured',
    'Approved task/changes-not-captured (M05 G-DIFF). Per-repository reasons; capture.state stays available.',
    TASK_CHANGES_NOT_CAPTURED_ID,
    {
      // The design draws the alternates repository open to show its caption.
      changesChrome: {
        expandedRepos: [HARFLOW_MCP_ROOT, VENDORED_TOOLS_ROOT],
      },
    },
  ),
  changesScenario(
    'task-changes-unmerged',
    'Task · Changes · conflicts unknown',
    'Approved task/changes-unmerged (M05 G-DIFF). reported_conflicts is advisory.',
    TASK_CHANGES_UNMERGED_ID,
  ),
  changesScenario(
    'task-changes-running',
    'Task · Changes · running',
    'Approved task/changes-running (M05 G-DIFF). Capture happens once after settle.',
    TASK_CHANGES_RUNNING_ID,
  ),
  changesScenario(
    'task-changes-zero',
    'Task · Changes · zero rows',
    'Approved task/changes-zero (M05 G-DIFF). Complete capture may say no differences.',
    TASK_CHANGES_ZERO_ID,
  ),
  changesScenario(
    'task-changes-no-repository',
    'Task · Changes · no repository',
    'Approved task/changes-no-repository (M05 G-DIFF). Settled with no repository recorded.',
    TASK_CHANGES_NO_REPOSITORY_ID,
  ),
  changesScenario(
    'task-changes-text',
    'Task · Changes · reading one diff',
    'Approved task/changes-text (M05 G-DIFF). Loading, chunk, and cursor refusal panels.',
    TASK_CHANGES_TEXT_ID,
    { changesChrome: { textPanels: textSpecimenPanels() } },
  ),
  TASK_CHANGES_LOADING_SCENARIO,
  changesScenario(
    'task-changes-error',
    'Task · Changes · unavailable',
    'Approved task/changes-error (M05 G-DIFF). Stored document unavailable.',
    TASK_CHANGES_ERROR_ID,
  ),
  changesScenario(
    'task-changes-turns',
    'Task · Changes · which turn',
    'Approved task/changes-turns (M05 G-DIFF). Turn picker defaults to the current member.',
    TASK_CHANGES_TURNS_ID,
    {
      changesChrome: {
        selectedEntry: QUEUE_ENTRY,
        turns: turnsMembers(),
      },
    },
  ),
]
