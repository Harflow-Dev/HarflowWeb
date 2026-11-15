import type {
  TaskChangesObservation,
  TaskChangesRepository,
  TaskId,
} from '../../model'
import {
  HARFLOW_MCP_ROOT,
  committedScope,
  observation,
  repoBase,
  row,
  workingScope,
} from './taskChangesFixtureBuilders'

function collapsedCount(root: string, count: number): TaskChangesRepository {
  return repoBase({
    repositoryRoot: root,
    committed: committedScope({ rows: [], rowCount: count }),
    working: workingScope({ rows: [], rowCount: 0 }),
  })
}

/** Row ceiling reached: the scope stays available, only its rows are cut. */
function mcpLimited(): TaskChangesRepository {
  return repoBase({
    repositoryRoot: HARFLOW_MCP_ROOT,
    worktree: HARFLOW_MCP_ROOT,
    committed: committedScope({
      rowCount: 500,
      rowsTruncated: true,
      rows: [
        row({
          path: 'src/harflow_mcp/slots.py',
          status: 'modified',
          additions: 18,
          deletions: 6,
        }),
      ],
    }),
    working: workingScope({ rows: [], rowCount: 2 }),
  })
}

/** Committed range captured, working tree refused: the repository is available. */
function enginePartial(): TaskChangesRepository {
  return repoBase({
    repositoryRoot: '~/Code/Harflow/HarflowEngine',
    committed: committedScope({ rows: [], rowCount: 1 }),
    working: workingScope({
      state: 'not_captured',
      reason: 'git_dir_unverified',
      rowCount: 0,
    }),
  })
}

function docsSiteIncomplete(): TaskChangesRepository {
  return repoBase({
    repositoryRoot: '~/Code/docs-site',
    state: 'incomplete',
    reason: 'capture_timeout',
    committed: committedScope({
      state: 'incomplete',
      reason: 'capture_timeout',
      rowCount: 0,
    }),
    working: workingScope({
      state: 'incomplete',
      reason: 'capture_timeout',
      rowCount: 0,
    }),
  })
}

export function multiLimitedDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    captureState: 'incomplete',
    repositories: [
      mcpLimited(),
      collapsedCount('~/Code/Harflow/HarflowMac', 31),
      collapsedCount('~/Code/Harflow/HarflowDesign', 4),
      enginePartial(),
      docsSiteIncomplete(),
      repoBase({
        repositoryRoot: '~/Code/tools',
        state: 'not_captured',
        reason: 'alternates_present',
        committed: null,
        working: null,
      }),
      repoBase({
        repositoryRoot: '~/Code/old-checkout',
        state: 'unavailable',
        reason: 'repository_unavailable',
        committed: null,
        working: null,
      }),
      repoBase({
        repositoryRoot: '~/Code/site',
        state: 'incomplete',
        reason: 'budget_exhausted',
        committed: null,
        working: null,
      }),
    ],
  })
}
