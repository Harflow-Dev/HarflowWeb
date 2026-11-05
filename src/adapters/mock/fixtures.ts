/**
 * Deterministic mock presentation fixtures.
 *
 * Repository discovery is mock-only (future server repos) — not a ctl endpoint.
 * Harness/model names are fixture data, not claims about installed software.
 *
 * Launch outcome shapes cite HarflowMCP 0.0.10
 * commit 8a936de61b5f9f2fdff671b65b5384259267350b
 * contracts/v1/ctl-launch-run-{accepted,refused,unknown}.json
 */

import {
  asHarnessId,
  asModelId,
  asRepositoryId,
  type AccessOption,
  type ComposerContext,
  type HarnessOption,
  type RepositoryOption,
  type SidebarData,
} from '../../model'
import { populatedSidebarData } from './sidebarFixtures'

export const MOCK_REPOSITORIES: readonly RepositoryOption[] = [
  { id: asRepositoryId('repo-mcp'), label: 'HarflowMCP' },
  { id: asRepositoryId('repo-mac'), label: 'HarflowMac' },
  { id: asRepositoryId('repo-design'), label: 'HarflowDesign' },
]

export const MOCK_HARNESSES: readonly HarnessOption[] = [
  {
    id: asHarnessId('claude'),
    label: 'Claude Code',
    available: true,
    unavailableReason: null,
    defaultModelId: asModelId('opus-5.5'),
    models: [
      { id: asModelId('opus-5.5'), label: 'Opus 5.5' },
      { id: asModelId('sonnet-5.5'), label: 'Sonnet 5.5' },
      { id: asModelId('haiku-5'), label: 'Haiku 5' },
    ],
    accessLevels: ['read_only', 'edit_repo', 'publish'],
  },
  {
    id: asHarnessId('codex'),
    label: 'Codex',
    available: true,
    unavailableReason: null,
    defaultModelId: asModelId('gpt-6-astra'),
    models: [{ id: asModelId('gpt-6-astra'), label: 'gpt-6-astra' }],
    accessLevels: ['read_only', 'edit_repo', 'publish'],
  },
  {
    id: asHarnessId('opencode'),
    label: 'Opencode',
    available: true,
    unavailableReason: null,
    defaultModelId: asModelId('claude-sonnet-5'),
    models: [{ id: asModelId('claude-sonnet-5'), label: 'claude-sonnet-5' }],
    accessLevels: ['read_only', 'edit_repo'],
  },
  {
    id: asHarnessId('vibe'),
    label: 'Mistral Vibe',
    available: true,
    unavailableReason: null,
    defaultModelId: asModelId('vibe-default'),
    models: [{ id: asModelId('vibe-default'), label: 'Default model' }],
    accessLevels: ['read_only', 'edit_repo'],
  },
  {
    id: asHarnessId('antigravity'),
    label: 'Antigravity',
    available: false,
    unavailableReason: 'Not installed',
    defaultModelId: null,
    models: [],
    accessLevels: ['read_only'],
  },
]

export const MOCK_ACCESS: readonly AccessOption[] = [
  {
    id: 'read_only',
    label: 'Read-only',
    hint: 'Reads files, cannot change them',
    available: true,
  },
  {
    id: 'edit_repo',
    label: 'Can edit this repo',
    hint: 'Edits files in the selected repository',
    available: true,
  },
  {
    id: 'publish',
    label: 'Can publish',
    hint: 'Commits, pushes and opens pull requests',
    available: true,
  },
  {
    id: 'full',
    label: 'Full access',
    hint: 'Not available for this harness',
    available: false,
  },
]

export function populatedComposer(): ComposerContext {
  return {
    repositories: MOCK_REPOSITORIES,
    harnesses: MOCK_HARNESSES,
    accessOptions: MOCK_ACCESS,
    selectedRepositoryId: asRepositoryId('repo-mcp'),
    selectedHarnessId: asHarnessId('claude'),
    selectedModelId: asModelId('opus-5.5'),
    selectedAccess: 'edit_repo',
  }
}

export function populatedSidebar(): SidebarData {
  return populatedSidebarData()
}

export function emptySidebar(): SidebarData {
  return {
    needsYouCount: 0,
    coverageIncomplete: false,
    coverageNote: null,
    running: [],
    recent: [],
  }
}

export function partialSidebar(): SidebarData {
  return {
    needsYouCount: 1,
    coverageIncomplete: true,
    coverageNote:
      'Proposal: partial sidebar coverage shown as incomplete — not a design-approved specimen.',
    running: [
      {
        id: 'run-partial',
        title: 'Fix flaky slot release test',
        meta: '04:12',
        glyph: 'running',
        mappedTaskId: null,
      },
    ],
    recent: [],
  }
}
