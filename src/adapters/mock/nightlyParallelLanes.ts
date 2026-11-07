import type { WorkflowRunLane, WorkflowRunParallel } from '../../model'
import { NIGHTLY_REQUESTER_MODEL } from './nightlyPublishSnapshot'

/**
 * Parallel observation for the Nightly run.
 * Design pin f2a30d7e625ae448588dc844e0dec16eb980eeee
 * `v2/scripts/screens-workflow-run.js` state `workflow-run/parallel`.
 * Codex · gpt-6 in that specimen is adapted to the Nightly snapshot model
 * `Codex · gpt-6-astra`. Lane titles stay the Parallel specimen's names.
 */

export function nightlyParallel(): WorkflowRunParallel {
  return {
    lanes: [pythonLane(), npmLane(), draftLane()],
    workingLabel: 'Orchestrator is choosing the next node…',
    decisionAttemptsLabel: 'Decision attempts: 1 / 3',
  }
}

function pythonLane(): WorkflowRunLane {
  return {
    id: 'lane-scan-python',
    title: 'Scan Python deps',
    agentLabel: NIGHTLY_REQUESTER_MODEL,
    status: 'done',
    statusMeta: 'Done 02:14',
    composerName: 'Codex',
    blocks: [
      {
        kind: 'agent',
        runs: [
          { kind: 'text', value: 'Scanned ' },
          { kind: 'code', value: 'requirements.lock' },
          { kind: 'text', value: ' and ' },
          { kind: 'code', value: 'pyproject.toml' },
          {
            kind: 'text',
            value:
              '. Four packages have newer releases; two are security fixes.',
          },
        ],
      },
      {
        kind: 'tool',
        id: 'lane-pip-audit',
        summary: 'pip-audit -r requirements.lock',
        duration: '0:48',
      },
      { kind: 'result', text: 'Done · 4 updates · 02:14' },
    ],
  }
}

function npmLane(): WorkflowRunLane {
  return {
    id: 'lane-scan-npm',
    title: 'Scan npm deps',
    agentLabel: 'Claude Code · Opus 5.5',
    status: 'running',
    statusMeta: 'Running 02:51',
    composerName: 'Claude Code',
    blocks: [
      {
        kind: 'agent',
        runs: [
          {
            kind: 'text',
            value:
              'Scanning the workspace lockfile for outdated and vulnerable packages.',
          },
        ],
      },
      {
        kind: 'tool',
        id: 'lane-npm-audit',
        summary: 'npm audit --json',
        duration: '0:31',
      },
      {
        kind: 'agent',
        runs: [
          {
            kind: 'text',
            value: 'One high-severity advisory in a transitive dependency of ',
          },
          { kind: 'code', value: 'electron-builder' },
          { kind: 'text', value: '. Checking which versions fix it.' },
        ],
      },
      {
        kind: 'tool',
        id: 'lane-npm-outdated',
        summary: 'npm outdated --json',
        duration: '0:12',
      },
      { kind: 'working', text: 'Reading package-lock.json…' },
    ],
  }
}

function draftLane(): WorkflowRunLane {
  return {
    id: 'lane-draft-pr',
    title: 'Draft upgrade PR',
    agentLabel: 'Claude Code · Opus 5.5',
    status: 'pending',
    statusMeta: 'Pending',
    composerName: 'Claude Code',
    blocks: [
      {
        kind: 'waiting',
        title: 'Waits for both scans',
        caption: 'This task starts when the Python and npm scans are done.',
      },
    ],
  }
}
