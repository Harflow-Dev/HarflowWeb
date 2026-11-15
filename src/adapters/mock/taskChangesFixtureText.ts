import type {
  TaskChangesObservation,
  TaskChangesTextObservation,
  TaskId,
} from '../../model'
import type {
  TaskChangesTextPanelSeed,
  TaskChangesTurnSeed,
} from './scenarioSeed'
import {
  BIG_MODULE_ENTRY,
  CONFIG_ENTRY,
  CONFIG_PY_PATH,
  HARFLOW_WEB_ROOT,
  QUEUE_ENTRY,
  SAME_PATH_WORKING,
  TEST_ENTRY,
  committedScope,
  contentAvailable,
  contentState,
  observation,
  repoBase,
  workingScope,
} from './taskChangesFixtureBuilders'
import {
  QUEUE_DIFF_RAW,
  WEB_COMMITTED_ROWS,
  parseDiffLines,
  textObservation,
} from './taskChangesFixtureSamples'
import {
  TASK_CHANGES_TURN_1_ID,
  TASK_CHANGES_TURN_2_ID,
  TASK_CHANGES_TURNS_ID,
} from './taskChangesFixtureIds'

export function queueText(): TaskChangesTextObservation {
  return textObservation({
    entry: QUEUE_ENTRY,
    status: 'modified',
    additions: 24,
    deletions: 3,
    content: contentAvailable(480),
    returnedBytes: 480,
    lines: parseDiffLines(QUEUE_DIFF_RAW),
  })
}

export function samePathWorkingText(): TaskChangesTextObservation {
  return textObservation({
    entry: SAME_PATH_WORKING,
    status: 'modified',
    additions: 2,
    deletions: 1,
    content: contentAvailable(80),
    returnedBytes: 80,
    lines: parseDiffLines([
      '@@ -58,4 +58,5 @@ class DeliveryQueue',
      '-    delay = 30',
      '+    delay = 45',
      '+    # local tuning',
    ]),
  })
}

export function bigModuleText(): TaskChangesTextObservation {
  return textObservation({
    entry: BIG_MODULE_ENTRY,
    status: 'modified',
    additions: 412,
    deletions: 90,
    content: contentState('truncated', 'file_limit', 65536),
    returnedBytes: 65536,
    totalBytes: 120000,
    lines: parseDiffLines([
      '@@ -1,4 +1,6 @@',
      ' import asyncio',
      '+import heapq',
      '+import time',
    ]),
  })
}

export function configChunkText(): TaskChangesTextObservation {
  return textObservation({
    entry: CONFIG_ENTRY,
    status: 'modified',
    additions: 2,
    deletions: 0,
    content: contentAvailable(49152),
    returnedBytes: 32768,
    totalBytes: 49152,
    hasMore: true,
    nextCursor: 'mock-config-more',
    lines: parseDiffLines([
      '@@ -8,3 +8,5 @@',
      ' RETRY_WINDOW = 3600',
      '+RETRY_BUDGET = 5',
    ]),
  })
}

export function testRefusalText(): TaskChangesTextObservation {
  return textObservation({
    entry: TEST_ENTRY,
    status: 'added',
    additions: 31,
    deletions: 0,
    content: contentAvailable(0),
    returnedBytes: 0,
    lines: [],
    refusal: {
      code: 'changes_cursor_expired',
      message: 'The stored changes were replaced since this list loaded.',
      reload: 'first',
    },
  })
}

/** The stacked text-mode specimen: loading, a paged chunk, then a refusal. */
export function textSpecimenPanels(): readonly TaskChangesTextPanelSeed[] {
  return [
    { kind: 'loading', entry: QUEUE_ENTRY },
    { kind: 'chunk', text: configChunkText() },
    { kind: 'refusal', entry: TEST_ENTRY },
  ]
}

/** Turn lineage seeded as chrome; each member is its own task. */
export function turnsMembers(): readonly TaskChangesTurnSeed[] {
  return [
    { taskId: TASK_CHANGES_TURNS_ID, turnIndex: 3, turnCount: 3, current: true },
    { taskId: TASK_CHANGES_TURN_2_ID, turnIndex: 2, turnCount: 3, current: false },
    { taskId: TASK_CHANGES_TURN_1_ID, turnIndex: 1, turnCount: 3, current: false },
  ]
}

/** The second turn's text for config.py (its own capture). */
export function turn2ConfigText(): TaskChangesTextObservation {
  return textObservation({
    entry: CONFIG_ENTRY,
    status: 'modified',
    additions: 1,
    deletions: 0,
    content: contentAvailable(40),
    returnedBytes: 40,
    lines: parseDiffLines(['@@ -1,2 +1,3 @@', ' VERSION = 1', '+# turn 2']),
  })
}

export function turn2Doc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: committedScope({
          rows: [WEB_COMMITTED_ROWS[1]!],
          rowCount: 1,
        }),
        working: workingScope({ rows: [], rowCount: 0 }),
      }),
    ],
  })
}

export function turn1Doc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: committedScope({ rows: [], rowCount: 0 }),
        working: workingScope({ rows: [], rowCount: 0 }),
      }),
    ],
  })
}

export { CONFIG_PY_PATH }
