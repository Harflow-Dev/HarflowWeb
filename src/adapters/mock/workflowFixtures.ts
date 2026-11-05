/**
 * Deterministic workflow list fixtures from HarflowDesign
 * commit 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-workflows.js states workflows/list and workflows/empty.
 *
 * Mock-only presentation — not a public ctl workflow catalog.
 */

import { asWorkflowId, type WorkflowSummary, type WorkflowsLoad } from '../../model'

export const POPULATED_WORKFLOWS: readonly WorkflowSummary[] = [
  {
    id: asWorkflowId('wf-nightly-audit'),
    title: 'Nightly dependency audit',
    description:
      'Checks lockfiles for outdated and vulnerable packages and opens a pull request.',
    nodeCount: 4,
  },
  {
    id: asWorkflowId('wf-release-checklist'),
    title: 'Release checklist',
    description:
      'Prepares the changelog, runs tests, builds installers and publishes the release.',
    nodeCount: 5,
  },
  {
    id: asWorkflowId('wf-backlog-triage'),
    title: 'Weekly backlog triage',
    description: 'Labels new issues, flags stale ones and drafts a summary.',
    nodeCount: 3,
  },
  {
    id: asWorkflowId('wf-review-pr'),
    title: 'Review pull request',
    description:
      'Reviews a pull request for correctness and tests, then posts findings.',
    nodeCount: 3,
  },
  {
    id: asWorkflowId('wf-docs-links'),
    title: 'Docs link check',
    description: 'Finds broken links in the docs and proposes fixes.',
    nodeCount: 2,
  },
]

export function populatedWorkflowsLoad(): WorkflowsLoad {
  return { kind: 'ready', workflows: POPULATED_WORKFLOWS }
}

export function emptyWorkflowsLoad(): WorkflowsLoad {
  return { kind: 'ready', workflows: [] }
}
