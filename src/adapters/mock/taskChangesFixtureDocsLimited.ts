import type { TaskChangesObservation, TaskId } from '../../model'
import {
  HARFLOW_MCP_ROOT,
  HARFLOW_WEB_ROOT,
  committedScope,
  contentState,
  observation,
  repoBase,
  row,
  workingScope,
} from './taskChangesFixtureBuilders'
import {
  WEB_COMMITTED_ROWS,
} from './taskChangesFixtureSamples'

export { multiLimitedDoc } from './taskChangesFixtureMultiLimited'
export { rowStatesDoc } from './taskChangesFixtureRowStates'

export function incompleteDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'incomplete',
    captureReason: 'capture_timeout',
    repositories: [
      repoBase({
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        state: 'incomplete',
        reason: 'capture_timeout',
        committed: committedScope({
          state: 'incomplete',
          reason: 'capture_timeout',
          rowCount: 1,
          rows: [
            row({
              path: 'big.txt',
              status: 'modified',
              additions: 1,
              deletions: 0,
              content: contentState('truncated', 'capture_timeout', 40),
            }),
          ],
        }),
        // The deadline ended the capture before conflicts were examined: the
        // scope stays available with no rows and `unmerged_unknown`.
        working: workingScope({
          rowCount: 0,
          unmergedUnknown: true,
          rows: [],
        }),
      }),
      repoBase({
        repositoryRoot: '~/Code/Harflow/HarflowMac',
        state: 'incomplete',
        reason: 'budget_exhausted',
        committed: null,
        working: null,
      }),
    ],
  })
}

export function notCapturedDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'available',
    repositories: [
      // Committed range captured, working tree not: the repository is
      // `available` and only the working-tree scope carries the refusal.
      repoBase({
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        baselineDirty: 'unknown',
        committed: committedScope({ rows: WEB_COMMITTED_ROWS, rowCount: 3 }),
        working: workingScope({
          state: 'not_captured',
          reason: 'git_dir_unverified',
          rowCount: 0,
        }),
      }),
      repoBase({
        repositoryRoot: '~/Code/vendored-tools',
        state: 'not_captured',
        reason: 'alternates_present',
        committed: null,
        working: null,
      }),
      repoBase({
        repositoryRoot: '~/Code/Harflow/HarflowDesign',
        state: 'not_captured',
        reason: 'repository_identity_changed',
        committed: null,
        working: null,
      }),
    ],
  })
}

export function unmergedDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    repositories: [
      // The index could not be read, so conflicts were never examined.
      repoBase({
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        committed: committedScope({
          rowCount: 1,
          rows: [
            row({
              path: 'src/harflow_mcp/slots.py',
              status: 'modified',
              additions: 18,
              deletions: 6,
            }),
          ],
        }),
        working: workingScope({
          rowCount: 1,
          unmergedUnknown: true,
          rows: [
            row({
              path: 'tests/test_slots.py',
              status: 'modified',
              additions: 3,
              deletions: 3,
            }),
          ],
        }),
      }),
      // The index was read and named one conflicted entry. The names are
      // advisory: they never add or hide a row.
      repoBase({
        repositoryRoot: HARFLOW_WEB_ROOT,
        committed: committedScope({ rows: [], rowCount: 1 }),
        working: workingScope({
          rows: [],
          rowCount: 0,
          reportedConflicts: [
            { path: 'harflow_web/delivery/queue.py', pathBytesB64: null },
          ],
        }),
      }),
    ],
  })
}
