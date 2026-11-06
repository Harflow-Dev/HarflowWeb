import type {
  HarnessesLoad,
  HarnessesObservation,
  SettingsHarnessFact,
} from '../../model'

const SPECIMEN_SERVER = '~/.harflow/bin/harflow-mcp'

/**
 * Approved settings/harnesses specimen.
 * Each row sets install, registration, and qualification explicitly.
 * The server path is fixture copy, not a lookup on this computer.
 * Antigravity registration stays unknown: absence is not "not registered".
 */
export function populatedHarnessesObservation(): HarnessesObservation {
  return {
    server: { kind: 'registered', serverLabel: SPECIMEN_SERVER },
    harnesses: [
      fact({
        id: 'claude-code',
        label: 'Claude Code',
        hint: null,
        install: { kind: 'installed' },
        registration: { kind: 'registered' },
        qualification: { kind: 'ready', label: 'Ready' },
        actions: ['mcp-approvals', 'remove'],
      }),
      fact({
        id: 'codex',
        label: 'Codex',
        hint: null,
        install: { kind: 'update-available' },
        registration: { kind: 'registered' },
        qualification: {
          kind: 'attention',
          label: 'Codex needs sign-in: run codex login, then refresh.',
        },
        actions: ['update'],
      }),
      fact({
        id: 'opencode',
        label: 'Opencode',
        hint: null,
        install: { kind: 'installed' },
        registration: { kind: 'registered' },
        qualification: { kind: 'ready', label: 'Ready' },
        actions: ['remove'],
      }),
      fact({
        id: 'mistral-vibe',
        label: 'Mistral Vibe',
        hint: null,
        install: { kind: 'installed' },
        registration: { kind: 'registered' },
        qualification: { kind: 'ready', label: 'Ready' },
        actions: ['remove'],
      }),
      fact({
        id: 'antigravity',
        label: 'Antigravity',
        hint: 'Install Antigravity, then refresh.',
        install: { kind: 'not-found', label: 'Not found on PATH' },
        registration: { kind: 'unknown' },
        qualification: {
          kind: 'not-qualified',
          label:
            'Antigravity was not found on PATH. Install it, then refresh.',
        },
        actions: [],
      }),
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
        actions: [],
      }),
      fact({
        id: 'registered-qualified',
        label: 'Registered and qualified',
        hint: null,
        install: { kind: 'unknown' },
        registration: { kind: 'registered' },
        qualification: { kind: 'ready', label: 'Ready' },
        actions: [],
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
