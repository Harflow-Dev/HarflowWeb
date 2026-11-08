import type {
  HarnessesLoad,
  HarnessesObservation,
  SettingsHarnessFact,
} from '../../model'

const SPECIMEN_SERVER = '~/.harflow/bin/harflow-mcp'

/** settings/mcp-approvals specimen. These entries belong only to Claude Code. */
const CLAUDE_APPROVALS = {
  kind: 'listed' as const,
  entries: ['harflow/*', 'github/create_pull_request', 'linear/get_issue'],
}

/**
 * Approved settings/harnesses specimen.
 * Each row sets install, registration, and qualification explicitly.
 * The server path is fixture copy, not a lookup on this computer.
 * Antigravity registration stays unknown: absence is not "not registered".
 */
function claudeCodeHarness(): SettingsHarnessFact {
  return fact({
    id: 'claude-code',
    label: 'Claude Code',
    hint: null,
    install: { kind: 'installed' },
    registration: { kind: 'registered' },
    qualification: { kind: 'ready', label: 'Ready' },
    approvals: CLAUDE_APPROVALS,
    actions: ['mcp-approvals', 'remove'],
  })
}

function codexHarness(): SettingsHarnessFact {
  return fact({
    id: 'codex',
    label: 'Codex',
    hint: null,
    install: { kind: 'update-available' },
    registration: { kind: 'registered' },
    qualification: {
      kind: 'attention',
      label: 'Codex needs sign-in: run codex login, then refresh.',
    },
    approvals: null,
    actions: ['update'],
  })
}

function readyInstalledHarnesses(): readonly SettingsHarnessFact[] {
  return [
    fact({
      id: 'opencode',
      label: 'Opencode',
      hint: null,
      install: { kind: 'installed' },
      registration: { kind: 'registered' },
      qualification: { kind: 'ready', label: 'Ready' },
      approvals: null,
      actions: ['remove'],
    }),
    fact({
      id: 'mistral-vibe',
      label: 'Mistral Vibe',
      hint: null,
      install: { kind: 'installed' },
      registration: { kind: 'registered' },
      qualification: { kind: 'ready', label: 'Ready' },
      approvals: null,
      actions: ['remove'],
    }),
  ]
}

function antigravityHarness(): SettingsHarnessFact {
  return fact({
    id: 'antigravity',
    label: 'Antigravity',
    hint: 'Install Antigravity, then refresh.',
    install: { kind: 'not-found', label: 'Not found on PATH' },
    registration: { kind: 'unknown' },
    qualification: {
      kind: 'not-qualified',
      label: 'Antigravity was not found on PATH. Install it, then refresh.',
    },
    approvals: null,
    actions: [],
  })
}

export function populatedHarnessesObservation(): HarnessesObservation {
  return {
    server: { kind: 'registered', serverLabel: SPECIMEN_SERVER },
    harnesses: [
      claudeCodeHarness(),
      codexHarness(),
      ...readyInstalledHarnesses(),
      antigravityHarness(),
    ],
  }
}

/**
 * States that must stay distinct from the specimen badges.
 * Installed does not imply registered or qualified.
 * Unknown does not collapse to not-found, not-registered, or Ready.
 */
export function divergentHarnessesObservation(): HarnessesObservation {
  return {
    server: { kind: 'unknown' },
    harnesses: [
      fact({
        id: 'installed-only',
        label: 'Installed only',
        hint: null,
        install: { kind: 'installed' },
        registration: { kind: 'not-registered' },
        qualification: { kind: 'unknown' },
        approvals: { kind: 'unknown' },
        actions: ['mcp-approvals'],
      }),
      fact({
        id: 'registered-qualified',
        label: 'Registered and qualified',
        hint: null,
        install: { kind: 'unknown' },
        registration: { kind: 'registered' },
        qualification: { kind: 'ready', label: 'Ready' },
        approvals: { kind: 'listed', entries: ['fixture/only-this-harness'] },
        actions: ['mcp-approvals'],
      }),
    ],
  }
}

export function populatedHarnessesLoad(): HarnessesLoad {
  return { kind: 'ready', observation: populatedHarnessesObservation() }
}

export function unavailableHarnessesLoad(): HarnessesLoad {
  return {
    kind: 'unavailable',
    message: 'Harness registration is unavailable.',
  }
}

function fact(row: SettingsHarnessFact): SettingsHarnessFact {
  return row
}
