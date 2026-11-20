import type { NeedsYouItem, NeedsYouLoad, NeedsYouObservation } from '../../model'
import {
  nightlyPublishNeedsYouApproval,
  slotReleaseNeedsYouApproval,
} from './needsYouApprovalFixtures'

/**
 * Approved needs-you/waiting specimen.
 * Approve labels name the action. They do not grant the whole task.
 */
function eventsConfigQuestion(): NeedsYouItem {
  return {
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
  }
}

export function waitingNeedsYouObservation(): NeedsYouObservation {
  return {
    coverage: 'complete',
    coverageNote: null,
    items: [
      slotReleaseNeedsYouApproval(),
      nightlyPublishNeedsYouApproval(),
      eventsConfigQuestion(),
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
