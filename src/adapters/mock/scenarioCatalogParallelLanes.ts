import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'

const CLAUDE_LANE_ID = 'lane-claude-titled'

function parallelSeed(
  openParallelGroupId: string,
  chrome?: {
    readonly showPrompt?: boolean
    readonly openMenuLaneId?: string
    readonly cancelAllConfirm?: boolean
    readonly frame?: 'minimum'
  },
): NonNullable<ScenarioDefinition['seed']> {
  return {
    openParallelGroupId,
    ...(chrome?.showPrompt === true
      ? { parallelGroupShowPrompt: true as const }
      : {}),
    ...(chrome?.openMenuLaneId !== undefined
      ? { parallelGroupOpenMenuLaneId: chrome.openMenuLaneId }
      : {}),
    ...(chrome?.cancelAllConfirm === true
      ? { parallelGroupCancelAllConfirm: true as const }
      : {}),
    ...(chrome?.frame === 'minimum' ? { frame: 'minimum' as const } : {}),
  }
}

/**
 * Approved parallel-group lane states (Design 2153ab1; history-boundary 4ff7d83).
 * Minimum twins reuse the same observations with seed.frame = minimum.
 */
export const PARALLEL_LANE_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'parallel-group-lanes-titled',
    label: 'Parallel group · Lanes titled',
    description:
      'Approved parallel-group/lanes-titled (Design 2153ab1): task titles, Harness · model captions, Send-only composers.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled'),
  }),
  base({
    id: 'parallel-group-lane-menu-open',
    label: 'Parallel group · Lane menu open',
    description:
      'Approved parallel-group/lane-menu-open (Design 2153ab1): Open task only.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', {
      openMenuLaneId: CLAUDE_LANE_ID,
    }),
  }),
  base({
    id: 'parallel-group-prompt-shown',
    label: 'Parallel group · View prompt shown',
    description:
      'Approved parallel-group/prompt-shown (Design 2153ab1): Original request in every lane.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', { showPrompt: true }),
  }),
  base({
    id: 'parallel-group-cancel-all-confirm',
    label: 'Parallel group · Cancel all confirm',
    description:
      'Approved parallel-group/cancel-all-confirm (Design 2153ab1). Confirm stays unavailable in the mock.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', {
      cancelAllConfirm: true,
    }),
  }),
  base({
    id: 'parallel-group-lanes-settled',
    label: 'Parallel group · All settled',
    description:
      'Approved parallel-group/lanes-settled (Design 2153ab1): badge “3 done”, no Cancel all.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-settled'),
  }),
  base({
    id: 'parallel-group-lane-failed',
    label: 'Parallel group · Lane failed',
    description: 'Approved parallel-group/lane-failed (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-failed'),
  }),
  base({
    id: 'parallel-group-lane-cancelled',
    label: 'Parallel group · Lane cancelled',
    description: 'Approved parallel-group/lane-cancelled (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-cancelled'),
  }),
  base({
    id: 'parallel-group-lane-taken-over',
    label: 'Parallel group · Lane taken over',
    description:
      'Approved parallel-group/lane-taken-over (Design 2153ab1): locked composer.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-taken-over'),
  }),
  base({
    id: 'parallel-group-lane-activity-unavailable',
    label: 'Parallel group · Activity unavailable',
    description:
      'Approved parallel-group/lane-activity-unavailable (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-activity-unavailable'),
  }),
  base({
    id: 'parallel-group-lane-history-boundary',
    label: 'Parallel group · History boundary',
    description:
      'Approved parallel-group/lane-history-boundary (Design 4ff7d83): replace-window notice only.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-history-boundary'),
  }),
  base({
    id: 'parallel-group-group-empty',
    label: 'Parallel group · Empty',
    description:
      'Approved parallel-group/group-empty (Design 2153ab1): View prompt disabled.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-group-empty'),
  }),
  base({
    id: 'parallel-group-two-lanes',
    label: 'Parallel group · Two lanes',
    description: 'Approved parallel-group/two-lanes (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-two-lanes'),
  }),
  // Minimum twins (1000 × 620 frame)
  base({
    id: 'parallel-group-lanes-titled-minimum',
    label: 'Parallel group · Lanes titled · 1000×620',
    description:
      'Approved parallel-group/lanes-titled-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', { frame: 'minimum' }),
  }),
  base({
    id: 'parallel-group-lane-menu-open-minimum',
    label: 'Parallel group · Lane menu · 1000×620',
    description:
      'Approved parallel-group/lane-menu-open-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', {
      openMenuLaneId: CLAUDE_LANE_ID,
      frame: 'minimum',
    }),
  }),
  base({
    id: 'parallel-group-prompt-shown-minimum',
    label: 'Parallel group · Prompt · 1000×620',
    description:
      'Approved parallel-group/prompt-shown-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', {
      showPrompt: true,
      frame: 'minimum',
    }),
  }),
  base({
    id: 'parallel-group-cancel-all-confirm-minimum',
    label: 'Parallel group · Cancel confirm · 1000×620',
    description:
      'Approved parallel-group/cancel-all-confirm-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-titled', {
      cancelAllConfirm: true,
      frame: 'minimum',
    }),
  }),
  base({
    id: 'parallel-group-lanes-settled-minimum',
    label: 'Parallel group · Settled · 1000×620',
    description:
      'Approved parallel-group/lanes-settled-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lanes-settled', { frame: 'minimum' }),
  }),
  base({
    id: 'parallel-group-lane-cancelled-minimum',
    label: 'Parallel group · Cancelled · 1000×620',
    description:
      'Approved parallel-group/lane-cancelled-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-cancelled', { frame: 'minimum' }),
  }),
  base({
    id: 'parallel-group-lane-failed-minimum',
    label: 'Parallel group · Failed · 1000×620',
    description:
      'Approved parallel-group/lane-failed-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-failed', { frame: 'minimum' }),
  }),
  base({
    id: 'parallel-group-group-empty-minimum',
    label: 'Parallel group · Empty · 1000×620',
    description:
      'Approved parallel-group/group-empty-minimum (Design 2153ab1).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-group-empty', { frame: 'minimum' }),
  }),
]
