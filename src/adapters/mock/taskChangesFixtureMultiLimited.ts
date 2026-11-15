import type {
  TaskChangesObservation,
  TaskChangesRepository,
  TaskId,
} from '../../model'
import {
  HARFLOW_MCP_ROOT,
  observation,
  repoBase,
  row,
  scopeAvailable,
  scopeCustom,
} from './taskChangesFixtureBuilders'

function collapsedCount(
  name: string,
  root: string,
  count: number,
): TaskChangesRepository {
  return repoBase({
    name,
    repositoryRoot: root,
    committed: scopeAvailable({ rows: [], rowCount: count }),
    working: scopeAvailable({ rows: [], rowCount: 0 }),
  })
}

function mcpLimited(): TaskChangesRepository {
  return repoBase({
    name: 'HarflowMCP',
    repositoryRoot: HARFLOW_MCP_ROOT,
    worktree: HARFLOW_MCP_ROOT,
    state: 'incomplete',
    reason: 'rows_truncated',
    committed: scopeAvailable({
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
    working: scopeAvailable({ rows: [], rowCount: 2 }),
  })
}

function enginePartial(): TaskChangesRepository {
  return repoBase({
    name: 'HarflowEngine',
    repositoryRoot: '~/Code/Harflow/HarflowEngine',
    state: 'available',
    reason: 'working_tree_not_captured',
    committed: scopeAvailable({ rows: [], rowCount: 1 }),
    working: scopeCustom({
      state: 'not_captured',
      reason: 'git_dir_unverified',
      rowCount: 0,
    }),
  })
}

function docsSiteIncomplete(): TaskChangesRepository {
  return repoBase({
    name: 'docs-site',
    repositoryRoot: '~/Code/docs-site',
    state: 'incomplete',
    reason: 'capture_timeout',
    committed: scopeCustom({
      state: 'incomplete',
      reason: 'capture_timeout',
      rowCount: 0,
    }),
    working: scopeCustom({
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
      collapsedCount('HarflowMac', '~/Code/Harflow/HarflowMac', 31),
      collapsedCount('HarflowDesign', '~/Code/Harflow/HarflowDesign', 4),
      enginePartial(),
      docsSiteIncomplete(),
      repoBase({
        name: 'tools',
        repositoryRoot: '~/Code/tools',
        state: 'not_captured',
        reason: 'alternates_present',
        committed: null,
        working: null,
      }),
      repoBase({
        name: 'old-checkout',
        repositoryRoot: '~/Code/old-checkout',
        state: 'unavailable',
        reason: 'repository_unavailable',
        committed: null,
        working: null,
      }),
      repoBase({
        name: 'site',
        repositoryRoot: '~/Code/site',
        state: 'incomplete',
        reason: 'budget_exhausted',
        committed: null,
        working: null,
      }),
    ],
  })
}
