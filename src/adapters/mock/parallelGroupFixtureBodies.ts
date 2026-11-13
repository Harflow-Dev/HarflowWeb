import {
  type ParallelGroupLane,
  type ParallelGroupLaneComposer,
  type WorkflowRunLaneBlock,
} from '../../model'

export const ENABLED_COMPOSER: ParallelGroupLaneComposer = {
  locked: false,
  disabled: false,
  placeholder: null,
  note: null,
}

export const ENFORCEMENT =
  'Enforced for every agent here: Network: not controlled.'

export const PROMPTS = {
  claude:
    'Review the preload bridge for ways the renderer can reach Electron or Node APIs it should not. Report each exposure with the file and the line.',
  codex:
    'Check the preload bridge against the IPC channel allow-list and the sandbox settings. Report each gap as a finding.',
  opencode:
    'Compare the functions the preload bridge exports with what the renderer actually calls. Report anything exported that the renderer does not need.',
} as const

export function claudeCodeOpeningBlocks(): readonly WorkflowRunLaneBlock[] {
  return [
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
          value: '. Starting with what the renderer can reach through ',
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
  ]
}

export function claudeCodeFindingBlocks(): readonly WorkflowRunLaneBlock[] {
  return [
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
  ]
}

function codexFindingsLegacy(): WorkflowRunLaneBlock[] {
  return [
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
  ]
}

export function codexBodyBlocks(): readonly WorkflowRunLaneBlock[] {
  return [
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
  ]
}

export function opencodeBodyBlocks(): readonly WorkflowRunLaneBlock[] {
  return [
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
  ]
}

function legacyLane(
  partial: Omit<ParallelGroupLane, 'composer' | 'end' | 'historyBoundary' | 'activityNote' | 'taskId' | 'prompt'> &
    Partial<
      Pick<
        ParallelGroupLane,
        'composer' | 'end' | 'historyBoundary' | 'activityNote' | 'taskId' | 'prompt'
      >
    >,
): ParallelGroupLane {
  return {
    taskId: null,
    prompt: '',
    end: null,
    composer: ENABLED_COMPOSER,
    historyBoundary: null,
    activityNote: null,
    ...partial,
  }
}

export function legacyClaudeLane(): ParallelGroupLane {
  return legacyLane({
    id: 'lane-claude-code',
    title: 'Claude Code',
    agentLabel: 'Opus 5.5',
    status: 'running',
    statusMeta: 'Running 03:24',
    composerName: 'Claude Code',
    blocks: [...claudeCodeOpeningBlocks(), ...claudeCodeFindingBlocks()],
  })
}

export function legacyCodexLane(): ParallelGroupLane {
  return legacyLane({
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
      ...codexFindingsLegacy(),
    ],
  })
}

export function legacyOpencodeLane(): ParallelGroupLane {
  return legacyLane({
    id: 'lane-opencode',
    title: 'Opencode',
    agentLabel: 'Kimi K3',
    status: 'done',
    statusMeta: 'Done 04:12',
    composerName: 'Opencode',
    blocks: [
      ...opencodeBodyBlocks(),
      { kind: 'result', text: 'Done · 2 findings · 04:12' },
    ],
  })
}

