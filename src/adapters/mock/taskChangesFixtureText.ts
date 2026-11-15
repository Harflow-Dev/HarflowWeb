import type {
  TaskChangesObservation,
  TaskChangesTextObservation,
  TaskId,
} from '../../model'
import {
  BIG_MODULE_ENTRY,
  CONFIG_ENTRY,
  CONFIG_PY_PATH,
  HARFLOW_WEB_ROOT,
  QUEUE_DIFF_RAW,
  QUEUE_ENTRY,
  SAME_PATH_WORKING,
  TEST_ENTRY,
  contentAvailable,
  contentState,
  observation,
  parseDiffLines,
  repoBase,
  scopeAvailable,
  WEB_COMMITTED_ROWS,
} from './taskChangesFixtureBuilders'
import {
  TASK_CHANGES_TURN_1_ID,
  TASK_CHANGES_TURN_2_ID,
  TASK_CHANGES_TURNS_ID,
} from './taskChangesFixtureIds'
import { singleDoc } from './taskChangesFixtureDocs'

export function queueText(): TaskChangesTextObservation {
  const lines = parseDiffLines(QUEUE_DIFF_RAW)
  return {
    entry: QUEUE_ENTRY,
    status: 'modified',
    additions: 24,
    deletions: 3,
    content: contentAvailable(480),
    offset: 0,
    returnedBytes: 480,
    totalBytes: 480,
    hasMore: false,
    nextCursor: null,
    lines,
    refusal: null,
  }
}

export function samePathWorkingText(): TaskChangesTextObservation {
  return {
    entry: SAME_PATH_WORKING,
    status: 'modified',
    additions: 2,
    deletions: 1,
    content: contentAvailable(80),
    offset: 0,
    returnedBytes: 80,
    totalBytes: 80,
    hasMore: false,
    nextCursor: null,
    lines: parseDiffLines([
      '@@ -58,4 +58,5 @@ class DeliveryQueue',
      '-    delay = 30',
      '+    delay = 45',
      '+    # local tuning',
    ]),
    refusal: null,
  }
}

export function bigModuleText(): TaskChangesTextObservation {
  return {
    entry: BIG_MODULE_ENTRY,
    status: 'modified',
    additions: 412,
    deletions: 90,
    content: contentState('truncated', 'file_limit', 65536),
    offset: 0,
    returnedBytes: 65536,
    totalBytes: 120000,
    hasMore: false,
    nextCursor: null,
    lines: parseDiffLines([
      '@@ -1,4 +1,6 @@',
      ' import asyncio',
      '+import heapq',
      '+import time',
    ]),
    refusal: null,
  }
}

export function configChunkText(): TaskChangesTextObservation {
  return {
    entry: CONFIG_ENTRY,
    status: 'modified',
    additions: 2,
    deletions: 0,
    content: contentAvailable(49152),
    offset: 0,
    returnedBytes: 32768,
    totalBytes: 49152,
    hasMore: true,
    nextCursor: 'mock-config-more',
    lines: parseDiffLines([
      '@@ -8,3 +8,5 @@',
      ' RETRY_WINDOW = 3600',
      '+RETRY_BUDGET = 5',
    ]),
    refusal: null,
  }
}

export function testRefusalText(): TaskChangesTextObservation {
  return {
    entry: TEST_ENTRY,
    status: 'added',
    additions: 31,
    deletions: 0,
    content: contentAvailable(0),
    offset: 0,
    returnedBytes: 0,
    totalBytes: 0,
    hasMore: false,
    nextCursor: null,
    lines: [],
    refusal: {
      code: 'changes_cursor_expired',
      message: 'The stored changes were replaced since this list loaded.',
      reload: 'first',
    },
  }
}

export function textSpecimenDoc(taskId: TaskId): TaskChangesObservation {
  const base = singleDoc(taskId)
  return {
    ...base,
    selectedEntry: QUEUE_ENTRY,
    text: null,
    textPanels: [
      { kind: 'loading', entry: QUEUE_ENTRY, scopeLabel: 'Committed' },
      {
        kind: 'chunk',
        text: configChunkText(),
        scopeLabel: 'Committed',
        moreLabel: 'Read 32 KiB of 48 KiB stored',
      },
      { kind: 'refusal', entry: TEST_ENTRY, scopeLabel: 'Committed' },
    ],
  }
}

export function turnsMembers() {
  return [
    {
      taskId: TASK_CHANGES_TURNS_ID,
      turnIndex: 3,
      turnCount: 3,
      current: true,
    },
    {
      taskId: TASK_CHANGES_TURN_2_ID,
      turnIndex: 2,
      turnCount: 3,
      current: false,
    },
    {
      taskId: TASK_CHANGES_TURN_1_ID,
      turnIndex: 1,
      turnCount: 3,
      current: false,
    },
  ] as const
}

export function turnsDoc(taskId: TaskId): TaskChangesObservation {
  const base = singleDoc(taskId)
  return {
    ...base,
    text: queueText(),
    turns: [...turnsMembers()],
  }
}

export function turn2Doc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    selectedEntry: {
      repositoryRoot: HARFLOW_WEB_ROOT,
      scope: 'committed_range',
      path: CONFIG_PY_PATH,
    },
    text: {
      entry: CONFIG_ENTRY,
      status: 'modified',
      additions: 1,
      deletions: 0,
      content: contentAvailable(40),
      offset: 0,
      returnedBytes: 40,
      totalBytes: 40,
      hasMore: false,
      nextCursor: null,
      lines: parseDiffLines([
        '@@ -1,2 +1,3 @@',
        ' VERSION = 1',
        '+# turn 2',
      ]),
      refusal: null,
    },
    turns: [...turnsMembers()],
    repositories: [
      repoBase({
        name: 'HarflowWeb',
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: scopeAvailable({
          rows: [WEB_COMMITTED_ROWS[1]!],
          rowCount: 1,
        }),
        working: scopeAvailable({ rows: [], rowCount: 0 }),
      }),
    ],
  })
}

export function turn1Doc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    selectedEntry: null,
    turns: [...turnsMembers()],
    repositories: [
      repoBase({
        name: 'HarflowWeb',
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: scopeAvailable({ rows: [], rowCount: 0 }),
        working: scopeAvailable({ rows: [], rowCount: 0 }),
      }),
    ],
  })
}
