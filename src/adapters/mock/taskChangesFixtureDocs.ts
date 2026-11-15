import type { TaskChangesObservation, TaskId } from '../../model'
import {
  HARFLOW_MCP_ROOT,
  HARFLOW_WEB_ROOT,
  committedScope,
  observation,
  repoBase,
  row,
  workingScope,
} from './taskChangesFixtureBuilders'
import {
  WEB_COMMITTED_ROWS,
  WEB_WORKING_NAME_ONLY,
} from './taskChangesFixtureSamples'

export {
  incompleteDoc,
  multiLimitedDoc,
  notCapturedDoc,
  rowStatesDoc,
  unmergedDoc,
} from './taskChangesFixtureDocsLimited'

export function singleDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: committedScope({ rows: WEB_COMMITTED_ROWS, rowCount: 3 }),
        working: workingScope({ rows: [WEB_WORKING_NAME_ONLY], rowCount: 1 }),
      }),
    ],
  })
}

export function samePathDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_WEB_ROOT,
        baselineDirty: true,
        committed: committedScope({
          rows: [
            row({
              path: 'harflow_web/delivery/queue.py',
              status: 'modified',
              additions: 24,
              deletions: 3,
            }),
            row({
              path: 'harflow_web/config.py',
              status: 'modified',
              additions: 2,
              deletions: 0,
            }),
          ],
          rowCount: 2,
        }),
        working: workingScope({
          rows: [
            row({
              path: 'harflow_web/delivery/queue.py',
              status: 'modified',
              additions: 2,
              deletions: 1,
            }),
          ],
          rowCount: 1,
          countsAndPatchSeparate: true,
        }),
      }),
    ],
  })
}

export function multiDoc(taskId: TaskId): TaskChangesObservation {
  const collapsed = (root: string, count: number) =>
    repoBase({
      repositoryRoot: root,
      committed: committedScope({ rows: [], rowCount: count }),
      working: workingScope({ rows: [], rowCount: 0 }),
    })
  return observation({
    taskId,
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        committed: committedScope({
          rowCount: 84,
          rows: [
            row({
              path: 'src/harflow_mcp/slots.py',
              status: 'modified',
              additions: 18,
              deletions: 6,
            }),
            row({
              path: 'tests/test_slots.py',
              status: 'modified',
              additions: 7,
              deletions: 0,
            }),
          ],
        }),
        working: workingScope({ rows: [], rowCount: 2 }),
      }),
      collapsed('~/Code/Harflow/HarflowMac', 31),
      collapsed('~/Code/Harflow/HarflowDesign', 4),
      collapsed(HARFLOW_WEB_ROOT, 2),
      collapsed('~/Code/Harflow/HarflowEngine', 5),
      collapsed('~/Code/ops-scripts', 0),
      collapsed('~/Code/docs-site', 0),
      collapsed('~/Code/tools', 0),
    ],
  })
}

export function zeroDoc(taskId: TaskId): TaskChangesObservation {
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

export function noRepositoryDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'available',
    captureReason: 'no_repository',
    repositories: [],
  })
}

export function errorDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'unavailable',
    captureReason: 'capture_too_large',
    repositories: [],
  })
}

export function pendingCaptureDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'pending',
    captureReason: 'capture_settling',
    repositories: [],
  })
}

export function runningCaptureDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'pending',
    captureReason: 'task_running',
    repositories: [],
  })
}

/** Task-level refusal: the outcome was never observed, so nothing was read. */
export function unobservedCaptureDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'not_captured',
    captureReason: 'outcome_unobserved',
    repositories: [],
  })
}
