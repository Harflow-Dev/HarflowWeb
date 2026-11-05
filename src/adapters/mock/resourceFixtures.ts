/**
 * Deterministic resources fixtures from HarflowDesign
 * commit 3643d083700be4032c93237813b573d04bab6ab1
 * v2/scripts/screens-resources.js state resources/slots.
 *
 * Mock-only presentation — not a public ctl resources catalog.
 */

import {
  asHarnessId,
  type ResourceHarnessCard,
  type ResourcesLoad,
  type ResourcesObservation,
  type ResourceWaitingTask,
} from '../../model'

function installedCards(): readonly ResourceHarnessCard[] {
  return [
    {
      kind: 'installed',
      harnessId: asHarnessId('claude'),
      label: 'Claude Code',
      capacity: 3,
      used: 2,
      waitingCount: 0,
      holders: [
        {
          id: 'hold-claude-1',
          title: 'Fix flaky slot release test',
          meta: '04:12',
        },
        {
          id: 'hold-claude-2',
          title: 'Add retry budget to delivery queue',
          meta: '11:40',
        },
      ],
    },
    {
      kind: 'installed',
      harnessId: asHarnessId('codex'),
      label: 'Codex',
      capacity: 2,
      used: 2,
      waitingCount: 1,
      holders: [
        {
          id: 'hold-codex-1',
          title: 'Nightly dependency audit: Open pull request',
          meta: '32:05',
        },
        {
          id: 'hold-codex-2',
          title: 'Review: Electron preload bridge',
          meta: '06:31',
        },
      ],
    },
    {
      kind: 'installed',
      harnessId: asHarnessId('opencode'),
      label: 'Opencode',
      capacity: 2,
      used: 0,
      waitingCount: 0,
      holders: [],
    },
    {
      kind: 'installed',
      harnessId: asHarnessId('vibe'),
      label: 'Mistral Vibe',
      capacity: 1,
      used: 1,
      waitingCount: 0,
      holders: [
        {
          id: 'hold-vibe-1',
          title: 'Migrate events.jsonl reader',
          meta: '18:22',
        },
      ],
    },
    {
      kind: 'not_installed',
      harnessId: asHarnessId('antigravity'),
      label: 'Antigravity',
    },
  ]
}

function waitingRows(): readonly ResourceWaitingTask[] {
  return [
    {
      id: 'wait-1',
      title: 'Write contract fixtures for v1 tasks',
      detail: 'Waiting for a Codex slot',
      waitedMeta: 'Waited 4m',
    },
  ]
}

export function populatedResourcesObservation(): ResourcesObservation {
  return {
    harnesses: installedCards(),
    waiting: waitingRows(),
  }
}

export function populatedResourcesLoad(): ResourcesLoad {
  return {
    kind: 'ready',
    observation: populatedResourcesObservation(),
  }
}
