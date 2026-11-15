import type { TaskChangesObservation, TaskId } from '../../model'
import {
  HARFLOW_MCP_ROOT,
  HARFLOW_WEB_ROOT,
  WEB_COMMITTED_ROWS,
  WEB_WORKING_NAME_ONLY,
  observation,
  repoBase,
  row,
  scopeAvailable,
} from './taskChangesFixtureBuilders'

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
    selectedEntry: {
      repositoryRoot: HARFLOW_WEB_ROOT,
      scope: 'committed_range',
      path: 'harflow_web/delivery/queue.py',
    },
    repositories: [
      repoBase({
        name: 'HarflowWeb',
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: scopeAvailable({ rows: WEB_COMMITTED_ROWS, rowCount: 3 }),
        working: scopeAvailable({
          rows: [WEB_WORKING_NAME_ONLY],
          rowCount: 1,
        }),
      }),
    ],
  })
}

export function samePathDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    selectedEntry: {
      repositoryRoot: HARFLOW_WEB_ROOT,
      scope: 'working_tree',
      path: 'harflow_web/delivery/queue.py',
    },
    repositories: [
      repoBase({
        name: 'HarflowWeb',
        repositoryRoot: HARFLOW_WEB_ROOT,
        baselineDirty: true,
        committed: scopeAvailable({
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
        working: scopeAvailable({
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
  const collapsed = (name: string, root: string, count: number) =>
    repoBase({
      name,
      repositoryRoot: root,
      committed: scopeAvailable({ rows: [], rowCount: count }),
      working: scopeAvailable({ rows: [], rowCount: 0 }),
    })
  return observation({
    taskId,
    repositories: [
      repoBase({
        name: 'HarflowMCP',
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        committed: scopeAvailable({
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
        working: scopeAvailable({ rows: [], rowCount: 2 }),
      }),
      collapsed('HarflowMac', '~/Code/Harflow/HarflowMac', 31),
      collapsed('HarflowDesign', '~/Code/Harflow/HarflowDesign', 4),
      collapsed('HarflowWeb', HARFLOW_WEB_ROOT, 2),
      collapsed('HarflowEngine', '~/Code/Harflow/HarflowEngine', 5),
      collapsed('ops-scripts', '~/Code/ops-scripts', 0),
      collapsed('docs-site', '~/Code/docs-site', 0),
      collapsed('tools', '~/Code/tools', 0),
    ],
  })
}

export function zeroDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
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
