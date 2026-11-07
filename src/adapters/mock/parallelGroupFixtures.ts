import {
  asParallelGroupId,
  PARALLEL_GROUP_UNAVAILABLE,
  type ParallelGroupId,
  type ParallelGroupLoad,
  type ParallelGroupObservation,
  type WorkflowRunLane,
} from '../../model'

/**
 * parallel-group/lanes from HarflowDesign
 * 17739e4 (immutable pin for this mock).
 * Path: v2/scripts/screens-parallel-group.js
 * State: parallel-group/lanes.
 * Mock-only — not a public ctl Parallel group protocol.
 */

export const PRELOAD_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-preload-bridge',
)

function claudeCodeLane(): WorkflowRunLane {
  return {
    id: 'lane-claude-code',
    title: 'Claude Code',
    agentLabel: 'Opus 5.5',
    status: 'running',
    statusMeta: 'Running 03:24',
    composerName: 'Claude Code',
    blocks: [
      {
        kind: 'agent',
        runs: [
          {
            kind: 'text',
            value: 'Reviewing the preload bridge in ',
          },
          { kind: 'code', value: 'src/preload/bridge.ts' },
          {
            kind: 'text',
            value:
              '. Starting with what the renderer can reach through ',
          },
          { kind: 'code', value: 'contextBridge' },
          { kind: 'text', value: '.' },
        ],
      },
      {
        kind: 'tool',
        id: 'pg-read-6',
        summary: 'Read 6 files',
        duration: '0:09',
        icon: 'file',
        summaryKind: 'plain',
      },
      {
        kind: 'agent',
        runs: [
          { kind: 'code', value: 'exposeInMainWorld' },
          {
            kind: 'text',
            value: ' hands the renderer the raw ',
          },
          { kind: 'code', value: 'ipcRenderer.invoke' },
          {
            kind: 'text',
            value: ', so any channel name is callable. The allow-list in ',
          },
          { kind: 'code', value: 'channels.ts' },
          { kind: 'text', value: ' is never applied here.' },
        ],
      },
      {
        kind: 'tool',
        id: 'pg-rg-ipc',
        summary: 'rg "ipcRenderer" src/preload',
        duration: '0:02',
        icon: 'terminal',
        summaryKind: 'ran-code',
      },
      {
        kind: 'working',
        text: 'Reading src/preload/bridge.ts…',
      },
    ],
  }
}

function codexLane(): WorkflowRunLane {
  return {
    id: 'lane-codex',
    title: 'Codex',
    agentLabel: 'gpt-6',
    status: 'done',
    statusMeta: 'Done 04:51',
    composerName: 'Codex',
    blocks: [
      {
        kind: 'agent',
        runs: [
          {
            kind: 'text',
            value:
              'Checked the bridge against the channel allow-list and the sandbox settings.',
          },
        ],
      },
      {
        kind: 'tool',
        id: 'pg-read-5',
        summary: 'Read 5 files',
        duration: '0:07',
        icon: 'file',
        summaryKind: 'plain',
      },
      {
        kind: 'agent',
        runs: [{ kind: 'text', value: 'Three findings:' }],
        listItems: [
          [
            { kind: 'text', value: 'the bridge exposes ' },
            { kind: 'code', value: 'ipcRenderer.invoke' },
            { kind: 'text', value: ' without a channel check' },
          ],
          [
            { kind: 'code', value: 'sandbox' },
            { kind: 'text', value: ' is off for the settings window' },
          ],
          [
            {
              kind: 'text',
              value:
                'reply payloads from main are not validated before they reach the renderer',
            },
          ],
        ],
      },
      { kind: 'result', text: 'Done · 3 findings · 04:51' },
    ],
  }
}

function opencodeLane(): WorkflowRunLane {
  return {
    id: 'lane-opencode',
    title: 'Opencode',
    agentLabel: 'Kimi K3',
    status: 'done',
    statusMeta: 'Done 04:12',
    composerName: 'Opencode',
    blocks: [
      {
        kind: 'agent',
        runs: [
          {
            kind: 'text',
            value:
              'Compared the preload exports with what the renderer actually calls.',
          },
        ],
      },
      {
        kind: 'tool',
        id: 'pg-rg-harflow',
        summary: 'rg "window.harflow" src/renderer',
        duration: '0:03',
        icon: 'terminal',
        summaryKind: 'ran-code',
      },
      {
        kind: 'agent',
        runs: [{ kind: 'text', value: 'Two findings:' }],
        listItems: [
          [
            { kind: 'text', value: 'the bridge exposes ' },
            { kind: 'code', value: 'ipcRenderer.invoke' },
            { kind: 'text', value: ' without a channel check' },
          ],
          [
            { kind: 'code', value: 'removeAllListeners' },
            {
              kind: 'text',
              value:
                ' is exported, so the renderer can drop main-process listeners',
            },
          ],
        ],
      },
      { kind: 'result', text: 'Done · 2 findings · 04:12' },
    ],
  }
}

export function preloadParallelGroup(): ParallelGroupObservation {
  return {
    groupId: PRELOAD_PARALLEL_GROUP_ID,
    title: 'Review preload bridge',
    statusLabel: '1 running · 2 done',
    enforcementLabel:
      'Enforced for every agent here: Network: not controlled.',
    lanes: [claudeCodeLane(), codexLane(), opencodeLane()],
  }
}

const BY_ID = new Map<ParallelGroupId, ParallelGroupObservation>([
  [PRELOAD_PARALLEL_GROUP_ID, preloadParallelGroup()],
])

export function parallelGroupLoadFor(groupId: ParallelGroupId): ParallelGroupLoad {
  const group = BY_ID.get(groupId)
  if (!group) {
    return { kind: 'unavailable', message: PARALLEL_GROUP_UNAVAILABLE }
  }
  return { kind: 'ready', group }
}
