import type { TaskChangesObservation, TaskChangesRow, TaskId } from '../../model'
import {
  HARFLOW_MCP_ROOT,
  contentState,
  observation,
  repoBase,
  row,
  scopeAvailable,
} from './taskChangesFixtureBuilders'

const SPECS: readonly Parameters<typeof row>[0][] = [
  {
    path: 'src/big_module.py',
    status: 'modified',
    additions: 412,
    deletions: 90,
    content: contentState('truncated', 'file_limit', 65536),
  },
  {
    path: 'src/late_file.py',
    status: 'modified',
    additions: 12,
    deletions: 1,
    content: contentState('truncated', 'task_limit', 1200),
  },
  {
    path: 'src/last_file.py',
    status: 'modified',
    additions: 4,
    deletions: 2,
    content: contentState('omitted_size', 'task_limit', null),
  },
  {
    path: 'assets/icon.png',
    status: 'added',
    additions: null,
    deletions: null,
    content: contentState('binary', null, null),
  },
  {
    path: 'vendor/fixtures',
    status: 'submodule',
    additions: null,
    deletions: null,
    content: contentState('not_captured', 'submodule', null),
  },
  {
    path: 'src/merge_me.py',
    status: 'unmerged',
    additions: 3,
    deletions: 3,
    content: contentState('not_captured', 'unmerged', null),
  },
  {
    path: 'src/very/long/…/truncated.py',
    status: 'modified',
    additions: null,
    deletions: null,
    pathTruncated: true,
    content: contentState('not_captured', 'path_too_long', null),
  },
  {
    path: 'legacy/caf\\xe9.txt',
    status: 'modified',
    additions: 1,
    deletions: 1,
    content: contentState('not_captured', 'bytes_not_utf8', null),
  },
]

function committedRows(): readonly TaskChangesRow[] {
  return SPECS.map((spec) => row(spec))
}

export function rowStatesDoc(taskId: TaskId): TaskChangesObservation {
  return observation({
    taskId,
    selectedEntry: {
      repositoryRoot: HARFLOW_MCP_ROOT,
      scope: 'committed_range',
      path: 'src/big_module.py',
    },
    repositories: [
      repoBase({
        name: 'HarflowMCP',
        repositoryRoot: HARFLOW_MCP_ROOT,
        worktree: HARFLOW_MCP_ROOT,
        committed: scopeAvailable({ rowCount: 8, rows: committedRows() }),
        working: scopeAvailable({
          rowCount: 1,
          rows: [
            row({
              path: 'build/',
              status: 'untracked',
              additions: null,
              deletions: null,
              content: contentState('not_captured', 'untracked', null),
            }),
          ],
        }),
      }),
    ],
  })
}
