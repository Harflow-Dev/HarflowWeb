import type { NeedsYouLoad, NeedsYouObservation } from '../../model'
import {
  NIGHTLY_PUBLISH_SNAPSHOT,
  NIGHTLY_REQUESTER_MODEL,
} from './nightlyPublishSnapshot'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'
import { SLOT_RELEASE_TASK_ID } from './taskFixtures'

/**
 * Approved needs-you/waiting specimen.
 * Approve labels name the action. They do not grant the whole task.
 */
export function waitingNeedsYouObservation(): NeedsYouObservation {
  return {
    coverage: 'complete',
    coverageNote: null,
    items: [
      {
        kind: 'approval',
        id: 'approve-slot-release-test',
        actionLabel: 'Wants to run a command',
        exactAction: 'npm test -- --runInBand slot-release',
        detail: 'In ~/Code/Harflow/HarflowMCP · Claude Code · Opus 5.5',
        approveLabel: 'Approve once',
        rejectLabel: 'Reject',
        context: {
          kind: 'task',
          title: 'Fix flaky slot release test',
          waitingLabel: 'waiting 3m',
          taskId: SLOT_RELEASE_TASK_ID,
        },
      },
      {
        kind: 'approval',
        id: 'approve-nightly-publish',
        actionLabel: 'Wants to publish',
        exactAction: NIGHTLY_PUBLISH_SNAPSHOT.publishAction,
        detail: `${NIGHTLY_PUBLISH_SNAPSHOT.needsYouAccess} · ${NIGHTLY_REQUESTER_MODEL}`,
        approveLabel: 'Approve this publish',
        rejectLabel: 'Reject',
        context: {
          kind: 'workflow',
          title: 'Nightly dependency audit',
          step: 'Open pull request',
          waitingLabel: 'waiting 1h',
          runId: NIGHTLY_AUDIT_RUN_ID,
        },
      },
      {
        kind: 'question',
        id: 'question-events-config',
        prompt: 'Which config should win when both are set?',
        detail: 'Opencode · claude-sonnet-5',
        context: {
          kind: 'task',
          title: 'Migrate events.jsonl reader',
          waitingLabel: 'waiting 12m',
          taskId: null,
        },
      },
    ],
  }
}

/** Approved needs-you/empty specimen. Complete coverage, zero items. */
export function emptyNeedsYouObservation(): NeedsYouObservation {
  return { coverage: 'complete', coverageNote: null, items: [] }
}

/** Known items only. Must not be presented as a closed total or as empty. */
export function partialNeedsYouObservation(): NeedsYouObservation {
  const waiting = waitingNeedsYouObservation()
  const first = waiting.items[0]
  if (!first) {
    throw new Error('waiting fixture has no items')
  }
  return {
    coverage: 'partial',
    coverageNote:
      'Coverage is incomplete. These are not every request that may need you.',
    items: [first],
  }
}

/** Proves literal text is not parsed as HTML. Not the screenshot fixture. */
export function literalNeedsYouObservation(): NeedsYouObservation {
  return {
    coverage: 'complete',
    coverageNote: null,
    items: [
      {
        kind: 'question',
        id: 'question-literal',
        prompt: "<script>alert('x')</script> — café 日本語",
        detail: 'Fixture detail',
        context: {
          kind: 'task',
          title: 'Literal question',
          waitingLabel: 'waiting 1m',
          taskId: null,
        },
      },
    ],
  }
}

export function waitingNeedsYouLoad(): NeedsYouLoad {
  return { kind: 'ready', observation: waitingNeedsYouObservation() }
}

export function emptyNeedsYouLoad(): NeedsYouLoad {
  return { kind: 'ready', observation: emptyNeedsYouObservation() }
}

export function unavailableNeedsYouLoad(): NeedsYouLoad {
  return { kind: 'unavailable', message: 'Needs you is unavailable.' }
}
