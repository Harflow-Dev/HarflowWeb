import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'

function parallelSeed(
  openParallelGroupId: string,
  chrome?: {
    readonly queuedCancelOutcome?: string
  },
): NonNullable<ScenarioDefinition['seed']> {
  return {
    openParallelGroupId,
    ...(chrome?.queuedCancelOutcome !== undefined
      ? { parallelGroupQueuedCancelOutcome: chrome.queuedCancelOutcome }
      : {}),
  }
}

/** Approved queued-message Parallel group lanes (Design 2153ab1). */
export const PARALLEL_QUEUED_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'parallel-group-lane-messages-queued',
    label: 'Parallel group · Messages queued',
    description:
      'Approved parallel-group/lane-messages-queued (Design 2153ab1): two Queued bubbles with Cancel.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-messages-queued'),
  }),
  base({
    id: 'parallel-group-lane-message-delivering',
    label: 'Parallel group · Message delivering',
    description:
      'Approved parallel-group/lane-message-delivering (Design 2153ab1): Queued caption, no Cancel.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-message-delivering'),
  }),
  base({
    id: 'parallel-group-lane-message-uncertain',
    label: 'Parallel group · Message uncertain',
    description:
      'Approved parallel-group/lane-message-uncertain (Design 2153ab1): Delivery uncertain, no Cancel.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-message-uncertain'),
  }),
  base({
    id: 'parallel-group-lane-message-cancelled',
    label: 'Parallel group · Message cancelled',
    description:
      'Approved parallel-group/lane-message-cancelled (Design 2153ab1): remaining queue + cancelled outcome.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: parallelSeed('parallel-group-lane-message-cancelled', {
      queuedCancelOutcome: 'Queued message cancelled.',
    }),
  }),
]
