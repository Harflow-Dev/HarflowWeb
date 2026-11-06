import { asRepositoryId, asWorkflowId } from '../../model'
import type {
  WorkflowId,
  WorkflowOverrideChoice,
  WorkflowPermissionSet,
  WorkflowRunContext,
  WorkflowRunContextLoad,
} from '../../model'

/**
 * Run-form fixtures from HarflowDesign commit
 * 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-workflows.js workflows/run.
 * Permission lines are fixture facts, not installed backends or enforcement.
 */

export const WORKFLOW_RUN_UNAVAILABLE =
  'This workflow is unavailable.'

export const RELEASE_WORKFLOW_ID = asWorkflowId('wf-release-checklist')
export const NIGHTLY_WORKFLOW_ID = asWorkflowId('wf-nightly-audit')

const REPOSITORIES = [
  { id: asRepositoryId('repo-mcp'), label: 'HarflowMCP' },
  { id: asRepositoryId('repo-mac'), label: 'HarflowMac' },
] as const

const OVERRIDES: readonly WorkflowOverrideChoice[] = [
  {
    id: 'saved',
    label: 'Orchestrator: saved',
    available: true,
    unavailableReason: null,
  },
  {
    id: 'custom',
    label: 'Custom orchestrator',
    available: false,
    unavailableReason:
      'Unsupported. This does not replace the saved orchestrator.',
  },
]

const RELEASE_TASK =
  'Prepare the 0.4.3 release of HarflowMCP: update the changelog from merged pull requests, run the full test suite and confirm the version bump matches the changelog.'

const RELEASE_GOAL =
  'A tagged release candidate with an accurate changelog and a green test run, ready to publish.'

const NIGHTLY_TASK =
  "Audit tonight's lockfiles and open a pull request only for the packages you list."

const NIGHTLY_GOAL = 'A pull request that names each outdated package.'

function permissions(
  workflow: 'release' | 'nightly',
): readonly WorkflowPermissionSet[] {
  const mcp = asRepositoryId('repo-mcp')
  const mac = asRepositoryId('repo-mac')
  if (workflow === 'release') {
    return [
      {
        repositoryId: mcp,
        overrideId: 'saved',
        facts: [
          {
            id: 'release-mcp-claude',
            participant: 'Claude Code',
            accessLabel: 'Can edit this repo',
            limitLabel: 'Network: not controlled',
          },
          {
            id: 'release-mcp-codex',
            participant: 'Codex',
            accessLabel: 'Read-only',
            limitLabel: 'Sandboxed',
          },
        ],
      },
      {
        repositoryId: mac,
        overrideId: 'saved',
        facts: [
          {
            id: 'release-mac-codex',
            participant: 'Codex',
            accessLabel: 'Read-only',
            limitLabel: 'Network: not controlled',
          },
        ],
      },
    ]
  }
  return [
    {
      repositoryId: mcp,
      overrideId: 'saved',
      facts: [
        {
          id: 'nightly-mcp-claude',
          participant: 'Claude Code',
          accessLabel: 'Read-only',
          limitLabel: 'Network: not controlled',
        },
        {
          id: 'nightly-mcp-opencode',
          participant: 'Opencode',
          accessLabel: 'Read-only',
          limitLabel: 'Network: not controlled',
        },
      ],
    },
    {
      repositoryId: mac,
      overrideId: 'saved',
      facts: [
        {
          id: 'nightly-mac-claude',
          participant: 'Claude Code',
          accessLabel: 'Read-only',
          limitLabel: 'Network: not controlled',
        },
      ],
    },
  ]
}

function context(
  id: WorkflowId,
  title: string,
  task: string,
  goal: string,
  workflow: 'release' | 'nightly',
): WorkflowRunContext {
  return {
    workflowId: id,
    title,
    suggestedTask: task,
    suggestedGoal: goal,
    repositories: REPOSITORIES,
    defaultRepositoryId: asRepositoryId('repo-mcp'),
    overrides: OVERRIDES,
    defaultOverrideId: 'saved',
    permissions: permissions(workflow),
  }
}

const CONTEXTS: Readonly<Record<string, WorkflowRunContext>> = {
  [RELEASE_WORKFLOW_ID]: context(
    RELEASE_WORKFLOW_ID,
    'Release checklist',
    RELEASE_TASK,
    RELEASE_GOAL,
    'release',
  ),
  [NIGHTLY_WORKFLOW_ID]: context(
    NIGHTLY_WORKFLOW_ID,
    'Nightly dependency audit',
    NIGHTLY_TASK,
    NIGHTLY_GOAL,
    'nightly',
  ),
  [asWorkflowId('wf-backlog-triage')]: context(
    asWorkflowId('wf-backlog-triage'),
    'Weekly backlog triage',
    'Label the issues opened this week.',
    'A short triage note for the open issues.',
    'nightly',
  ),
  [asWorkflowId('wf-review-pr')]: context(
    asWorkflowId('wf-review-pr'),
    'Review pull request',
    'Review the pull request for correctness and tests.',
    'Findings posted on the pull request.',
    'nightly',
  ),
  [asWorkflowId('wf-docs-links')]: context(
    asWorkflowId('wf-docs-links'),
    'Docs link check',
    'Find broken links in the docs.',
    'A list of broken links and proposed fixes.',
    'nightly',
  ),
}

export function workflowRunLoadFor(id: WorkflowId): WorkflowRunContextLoad {
  const found = CONTEXTS[id]
  if (!found) {
    return { kind: 'unavailable', message: WORKFLOW_RUN_UNAVAILABLE }
  }
  return { kind: 'ready', context: found }
}
