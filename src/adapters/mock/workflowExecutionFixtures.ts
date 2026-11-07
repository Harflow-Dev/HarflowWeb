import {
  asWorkflowId,
  asWorkflowNodeId,
  asWorkflowRunId,
  WORKFLOW_RUN_UNAVAILABLE,
  type WorkflowRunId,
  type WorkflowRunLoad,
  type WorkflowRunObservation,
  type WorkflowRunOnDemand,
  type WorkflowRunOnDemandCall,
} from '../../model'
import {
  NIGHTLY_PUBLISH_SNAPSHOT,
  NIGHTLY_REQUESTER_MODEL,
} from './nightlyPublishSnapshot'
import { nightlyParallelLanes } from './nightlyParallelLanes'

/**
 * workflow-run/graph-needs-you from HarflowDesign
 * 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-workflow-run.js.
 * The run id is not the Nightly definition id.
 */

export const NIGHTLY_AUDIT_RUN_ID = asWorkflowRunId('run-nightly-dependency-audit')
const NIGHTLY_DEFINITION_ID = asWorkflowId('wf-nightly-audit')

const SCAN = asWorkflowNodeId('run-scan-lockfiles')
const DRAFT = asWorkflowNodeId('run-draft-upgrade')
const OPEN_PR = asWorkflowNodeId('run-open-pull-request')
const NOTIFY = asWorkflowNodeId('run-notify')
export const SECURITY_REVIEWER_NODE_ID = asWorkflowNodeId('run-security-reviewer')
const CALL_2 = 'run-security-call-2'
const CALL_1 = 'run-security-call-1'
const PUBLISH = NIGHTLY_PUBLISH_SNAPSHOT
const PUBLISH_COMMAND = `git push origin ${PUBLISH.branch}
gh pr create --repo ${PUBLISH.remote} --title "${PUBLISH.pullRequestTitle}"`

export function nightlyAuditRun(): WorkflowRunObservation {
  return {
    runId: NIGHTLY_AUDIT_RUN_ID,
    definitionId: NIGHTLY_DEFINITION_ID,
    title: 'Nightly dependency audit',
    statusLabel: 'Needs you',
    progressLabel: 'Step 2 of 4 · 06:31',
    graphLabel: 'Workflow steps: Scan lockfiles, Draft upgrade plan, Open pull request, Notify',
    boardWidth: 790,
    boardHeight: 620,
    selectedNodeId: OPEN_PR,
    nodes: [
      path(SCAN, 'Scan lockfiles', 'Claude · Worker', 'Done 01:48', 'done', 14),
      path(DRAFT, 'Draft upgrade plan', 'Claude · Worker', 'Done 03:02', 'done', 210),
      path(OPEN_PR, 'Open pull request', 'Codex · Worker', 'Needs you 01:41', 'needs-you', 406),
      path(NOTIFY, 'Notify', 'Codex · Worker', 'Pending', 'pending', 602),
      {
        id: SECURITY_REVIEWER_NODE_ID,
        placement: 'standalone',
        title: 'Security reviewer',
        kindLabel: 'On demand',
        meta: '2 calls · one at a time',
        status: 'done',
        frame: null,
      },
      {
        id: asWorkflowNodeId('run-docs-checker'),
        placement: 'standalone',
        title: 'Docs checker',
        kindLabel: 'On demand',
        meta: 'Not called',
        status: 'idle',
        frame: null,
      },
    ],
    edges: [
      { id: 'run-scan-draft', from: SCAN, to: DRAFT, active: false },
      { id: 'run-draft-pr', from: DRAFT, to: OPEN_PR, active: false },
      { id: 'run-pr-notify', from: OPEN_PR, to: NOTIFY, active: true },
    ],
    detail: {
      title: 'Open pull request',
      statusLabel: 'Needs you',
      goal: 'Upgrade the three vulnerable dependencies with all tests passing, and open one pull request with the lockfile changes.',
      assessment: 'Assessment: in progress',
      agent: `${NIGHTLY_REQUESTER_MODEL} · ${PUBLISH.repository}`,
      message:
        'The upgrade plan changes 3 packages: httpx, pydantic and pytest. The lockfile is updated on the branch.',
      tools: [
        {
          id: 'run-tool-switch',
          summary: `git switch -c ${PUBLISH.branch}`,
          duration: '0:01',
          output: null,
        },
        {
          id: 'run-tool-pytest',
          summary: 'pytest -q',
          duration: '1:12',
          output: '812 passed in 71.40s',
        },
      ],
      approval: {
        title: 'Publish changes',
        source: NIGHTLY_REQUESTER_MODEL,
        body: PUBLISH.publishAction,
        command: PUBLISH_COMMAND,
        access: PUBLISH.runAccess,
      },
    },
    onDemand: [securityReviewerOnDemand()],
    parallel: nightlyParallelLanes(),
  }
}

const RUNS: Readonly<Record<string, WorkflowRunObservation>> = {
  [NIGHTLY_AUDIT_RUN_ID]: nightlyAuditRun(),
}

export function workflowExecutionLoadFor(id: WorkflowRunId): WorkflowRunLoad {
  const found = RUNS[id]
  if (!found || found.runId !== id) {
    return { kind: 'unavailable', message: WORKFLOW_RUN_UNAVAILABLE }
  }
  return { kind: 'ready', run: found }
}

function securityReviewerOnDemand(): WorkflowRunOnDemand {
  return {
    nodeId: SECURITY_REVIEWER_NODE_ID,
    title: 'Security reviewer',
    caption: 'On demand',
    introduction: 'Runs only when the orchestrator calls it, one call at a time.',
    calls: [
      { id: CALL_2, label: 'Call 2 · Done · 01:12', highlighted: true },
      { id: CALL_1, label: 'Call 1 · Done · 00:48', highlighted: false },
    ],
    call: securityReviewerCall(),
  }
}

function securityReviewerCall(): WorkflowRunOnDemandCall {
  return {
    id: CALL_2,
    caption: `Call 2 · ${NIGHTLY_REQUESTER_MODEL} · ${PUBLISH.repository}`,
    userMessage: 'Check the lockfile diff for packages with known advisories.',
    agentRuns: [
      { kind: 'text', value: 'Compared ' },
      { kind: 'code', value: 'uv.lock' },
      { kind: 'text', value: ' against the previous commit. Two packages changed: ' },
      { kind: 'code', value: 'httpx' },
      { kind: 'text', value: ' and ' },
      { kind: 'code', value: 'pydantic' },
      { kind: 'text', value: '. Neither has an open advisory.' },
    ],
    tool: {
      id: 'run-security-pip-audit',
      summary: 'pip-audit -r requirements.lock',
      duration: '0:41',
      output: null,
    },
    result: 'Done · no advisories · 01:12',
  }
}

function path(
  id: ReturnType<typeof asWorkflowNodeId>,
  title: string,
  kindLabel: string,
  meta: string,
  status: 'done' | 'needs-you' | 'pending',
  x: number,
): WorkflowRunObservation['nodes'][number] {
  return {
    id,
    placement: 'path',
    title,
    kindLabel,
    meta,
    status,
    frame: { x, y: 459, width: 174, height: 82 },
  }
}
