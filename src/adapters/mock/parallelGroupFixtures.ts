import {
  asParallelGroupId,
  PARALLEL_GROUP_UNAVAILABLE,
  type ParallelGroupId,
  type ParallelGroupLane,
  type ParallelGroupLoad,
  type ParallelGroupObservation,
} from '../../model'
import { PRELOAD_TASK_ID } from './taskFixtures'
import {
  ENABLED_COMPOSER,
  ENFORCEMENT,
  PROMPTS,
  claudeCodeFindingBlocks,
  claudeCodeOpeningBlocks,
  claudeCodeWorkingBlocks,
  codexBodyBlocks,
  legacyClaudeLane,
  legacyCodexLane,
  legacyOpencodeLane,
  opencodeBodyBlocks,
} from './parallelGroupFixtureBodies'

/**
 * Parallel group fixtures.
 *
 * Legacy `parallel-group/lanes`: original specimen (harness titles, findings).
 * Titled family: HarflowDesign `2153ab1` (`states-parallel-lanes.js`);
 * `lane-history-boundary` follows `4ff7d83`.
 */

export const PRELOAD_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-preload-bridge',
)
export const TITLED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lanes-titled',
)
export const SETTLED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lanes-settled',
)
export const FAILED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-failed',
)
export const CANCELLED_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-cancelled',
)
export const TAKEN_OVER_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-taken-over',
)
export const ACTIVITY_UNAVAILABLE_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-activity-unavailable',
)
export const HISTORY_BOUNDARY_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-lane-history-boundary',
)
export const EMPTY_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-group-empty',
)
export const TWO_LANES_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-two-lanes',
)
export const LOADING_TWO_PARALLEL_GROUP_ID = asParallelGroupId(
  'parallel-group-loading-two',
)

/** Original approved `parallel-group/lanes` specimen. */
export function preloadParallelGroup(): ParallelGroupObservation {
  return {
    groupId: PRELOAD_PARALLEL_GROUP_ID,
    title: 'Review preload bridge',
    statusLabel: '1 running · 2 done',
    enforcementLabel: ENFORCEMENT,
    lanes: [legacyClaudeLane(), legacyCodexLane(), legacyOpencodeLane()],
  }
}

function titledClaudeRunning(overrides: Partial<ParallelGroupLane> = {}): ParallelGroupLane {
  return {
    id: 'lane-claude-titled',
    title: 'Audit what the preload bridge exposes',
    agentLabel: 'Claude · Opus 5.5',
    status: 'running',
    statusMeta: 'Running 03:24',
    composerName: 'Claude',
    taskId: PRELOAD_TASK_ID,
    prompt: PROMPTS.claude,
    blocks: [
      ...claudeCodeOpeningBlocks(),
      ...claudeCodeFindingBlocks(),
      ...claudeCodeWorkingBlocks(),
    ],
    end: null,
    composer: ENABLED_COMPOSER,
    historyBoundary: null,
    activityNote: null,
    ...overrides,
  }
}

function titledCodexDone(overrides: Partial<ParallelGroupLane> = {}): ParallelGroupLane {
  return {
    id: 'lane-codex-titled',
    title: 'Check the allow-list and sandbox settings',
    agentLabel: 'Codex · gpt-6',
    status: 'done',
    statusMeta: 'Done 04:51',
    composerName: 'Codex',
    taskId: null,
    prompt: PROMPTS.codex,
    blocks: [...codexBodyBlocks()],
    end: { kind: 'done', clock: '04:51', extra: null },
    composer: ENABLED_COMPOSER,
    historyBoundary: null,
    activityNote: null,
    ...overrides,
  }
}

function titledOpencodeDone(overrides: Partial<ParallelGroupLane> = {}): ParallelGroupLane {
  return {
    id: 'lane-opencode-titled',
    title: 'Compare preload exports with renderer calls',
    agentLabel: 'Opencode',
    status: 'done',
    statusMeta: 'Done 04:12',
    composerName: 'Opencode',
    taskId: null,
    prompt: PROMPTS.opencode,
    blocks: [...opencodeBodyBlocks()],
    end: { kind: 'done', clock: '04:12', extra: null },
    composer: ENABLED_COMPOSER,
    historyBoundary: null,
    activityNote: null,
    ...overrides,
  }
}

function titledBase(
  groupId: ParallelGroupId,
  overrides: Partial<ParallelGroupObservation> = {},
): ParallelGroupObservation {
  return {
    groupId,
    title: 'Review preload bridge',
    statusLabel: '1 running · 2 done',
    enforcementLabel: ENFORCEMENT,
    lanes: [titledClaudeRunning(), titledCodexDone(), titledOpencodeDone()],
    ...overrides,
  }
}

export function titledParallelGroup(): ParallelGroupObservation {
  return titledBase(TITLED_PARALLEL_GROUP_ID)
}

export function settledParallelGroup(): ParallelGroupObservation {
  return titledBase(SETTLED_PARALLEL_GROUP_ID, {
    statusLabel: '3 done',
    lanes: [
      titledClaudeRunning({
        status: 'done',
        statusMeta: 'Done 05:02',
        blocks: [...claudeCodeOpeningBlocks(), ...claudeCodeFindingBlocks()],
        end: { kind: 'done', clock: '05:02', extra: null },
      }),
      titledCodexDone(),
      titledOpencodeDone(),
    ],
  })
}

export function failedParallelGroup(): ParallelGroupObservation {
  return titledBase(FAILED_PARALLEL_GROUP_ID, {
    statusLabel: '2 done · 1 failed',
    lanes: [
      titledClaudeRunning({
        status: 'failed',
        statusMeta: 'Failed 07:48',
        blocks: [...claudeCodeOpeningBlocks(), ...claudeCodeFindingBlocks()],
        end: { kind: 'failed', clock: '07:48', extra: null },
      }),
      titledCodexDone(),
      titledOpencodeDone(),
    ],
  })
}

export function cancelledParallelGroup(): ParallelGroupObservation {
  return titledBase(CANCELLED_PARALLEL_GROUP_ID, {
    statusLabel: '2 done · 1 cancelled',
    lanes: [
      titledClaudeRunning({
        status: 'cancelled',
        statusMeta: 'Cancelled 04:31',
        blocks: [...claudeCodeOpeningBlocks(), ...claudeCodeFindingBlocks()],
        end: { kind: 'cancelled', clock: '04:31', extra: null },
      }),
      titledCodexDone(),
      titledOpencodeDone(),
    ],
  })
}

export function takenOverParallelGroup(): ParallelGroupObservation {
  return titledBase(TAKEN_OVER_PARALLEL_GROUP_ID, {
    statusLabel: '2 done · 1 cancelled',
    lanes: [
      titledClaudeRunning({
        status: 'cancelled',
        statusMeta: 'Cancelled 04:31',
        agentLabel: 'Claude · Opus 5.5 · taken over',
        blocks: [...claudeCodeOpeningBlocks(), ...claudeCodeFindingBlocks()],
        end: { kind: 'cancelled', clock: '04:31', extra: 'taken over' },
        composer: {
          locked: true,
          placeholder:
            'Messages are off — you took this task over in Terminal',
          note: null,
        },
      }),
      titledCodexDone(),
      titledOpencodeDone(),
    ],
  })
}

export function activityUnavailableParallelGroup(): ParallelGroupObservation {
  return titledBase(ACTIVITY_UNAVAILABLE_PARALLEL_GROUP_ID, {
    lanes: [
      titledClaudeRunning(),
      titledCodexDone({
        blocks: [],
        activityNote: 'Activity log unavailable.',
        composer: {
          locked: false,
          placeholder: null,
          note: 'Messaging is unavailable for this activity view.',
        },
      }),
      titledOpencodeDone({
        blocks: [],
        activityNote: 'No activity to display.',
      }),
    ],
  })
}

export function historyBoundaryParallelGroup(): ParallelGroupObservation {
  return titledBase(HISTORY_BOUNDARY_PARALLEL_GROUP_ID, {
    lanes: [
      titledClaudeRunning({
        historyBoundary:
          'Observation session changed · cached history is not current. Replace this window to load current activity.',
      }),
      titledCodexDone(),
      titledOpencodeDone(),
    ],
  })
}

export function emptyParallelGroup(): ParallelGroupObservation {
  return titledBase(EMPTY_PARALLEL_GROUP_ID, {
    statusLabel: null,
    enforcementLabel: null,
    lanes: [],
  })
}

export function twoLanesParallelGroup(): ParallelGroupObservation {
  return titledBase(TWO_LANES_PARALLEL_GROUP_ID, {
    statusLabel: '1 running · 1 done',
    lanes: [titledClaudeRunning(), titledCodexDone()],
  })
}

const BY_ID = new Map<ParallelGroupId, ParallelGroupObservation>([
  [PRELOAD_PARALLEL_GROUP_ID, preloadParallelGroup()],
  [TITLED_PARALLEL_GROUP_ID, titledParallelGroup()],
  [SETTLED_PARALLEL_GROUP_ID, settledParallelGroup()],
  [FAILED_PARALLEL_GROUP_ID, failedParallelGroup()],
  [CANCELLED_PARALLEL_GROUP_ID, cancelledParallelGroup()],
  [TAKEN_OVER_PARALLEL_GROUP_ID, takenOverParallelGroup()],
  [ACTIVITY_UNAVAILABLE_PARALLEL_GROUP_ID, activityUnavailableParallelGroup()],
  [HISTORY_BOUNDARY_PARALLEL_GROUP_ID, historyBoundaryParallelGroup()],
  [EMPTY_PARALLEL_GROUP_ID, emptyParallelGroup()],
  [TWO_LANES_PARALLEL_GROUP_ID, twoLanesParallelGroup()],
  // Design loading-two is the skeleton of two-lanes: same content, own id.
  [
    LOADING_TWO_PARALLEL_GROUP_ID,
    { ...twoLanesParallelGroup(), groupId: LOADING_TWO_PARALLEL_GROUP_ID },
  ],
])

export function parallelGroupLoadFor(groupId: ParallelGroupId): ParallelGroupLoad {
  const group = BY_ID.get(groupId)
  if (!group) {
    return { kind: 'unavailable', message: PARALLEL_GROUP_UNAVAILABLE }
  }
  return { kind: 'ready', group }
}

/**
 * Deferred first-load: the member count of a known group with lanes. Unknown
 * and empty groups report null; loading-two always reports null while its
 * ready payload is the two-lanes fixture.
 */
export function deferredParallelGroupLoading(
  groupId: ParallelGroupId,
): ParallelGroupLoad {
  if (groupId === LOADING_TWO_PARALLEL_GROUP_ID) {
    return { kind: 'loading', memberCount: null }
  }
  const lanes = BY_ID.get(groupId)?.lanes.length ?? 0
  return { kind: 'loading', memberCount: lanes > 0 ? lanes : null }
}
