import type { TaskChangesObservation, TaskId } from '../../model'
import {
  HARFLOW_MCP_ROOT,
  HARFLOW_WEB_ROOT,
  WEB_COMMITTED_ROWS,
  contentState,
  observation,
  repoBase,
  row,
  scopeAvailable,
  scopeCustom,
} from './taskChangesFixtureBuilders'

export { multiLimitedDoc } from './taskChangesFixtureMultiLimited'
export { rowStatesDoc } from './taskChangesFixtureRowStates'

export function incompleteDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'incomplete',
    captureReason: 'capture_timeout',
    repositories: [
      repoBase({
        name: 'HarflowMCP',
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        state: 'incomplete',
        reason: 'capture_timeout',
        committed: scopeCustom({
          state: 'incomplete',
          reason: 'capture_timeout',
          rowCount: 1,
          rows: [
            row({
              path: 'big.txt',
              status: 'modified',
              additions: 1,
              deletions: 0,
              content: contentState('truncated', 'capture_timeout', null),
            }),
          ],
        }),
        working: scopeCustom({
          state: 'incomplete',
          reason: 'capture_timeout',
          rowCount: 0,
          unmergedUnknown: true,
          rows: [],
        }),
      }),
      repoBase({
        name: 'HarflowMac',
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
      repoBase({
        name: 'HarflowMCP',
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        baselineDirty: 'unknown',
        reason: 'working_tree_not_captured',
        committed: scopeAvailable({ rows: WEB_COMMITTED_ROWS, rowCount: 3 }),
        working: scopeCustom({
          state: 'not_captured',
          reason: 'git_dir_unverified',
          rowCount: 0,
        }),
      }),
      repoBase({
        name: 'vendored-tools',
        repositoryRoot: '~/Code/vendored-tools',
        state: 'not_captured',
        reason: 'alternates_present',
        committed: null,
        working: null,
      }),
      repoBase({
        name: 'HarflowDesign',
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
      repoBase({
        name: 'HarflowMCP',
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        committed: scopeAvailable({
          rowCount: 1,
          unmergedUnknown: true,
          rows: [
            row({
              path: 'src/harflow_mcp/slots.py',
              status: 'modified',
              additions: 18,
              deletions: 6,
            }),
          ],
        }),
        working: scopeAvailable({
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
      repoBase({
        name: 'HarflowWeb',
        repositoryRoot: HARFLOW_WEB_ROOT,
        reason: 'reported_conflict',
        committed: scopeAvailable({ rows: [], rowCount: 1 }),
        working: scopeAvailable({ rows: [], rowCount: 0 }),
      }),
    ],
  })
}
