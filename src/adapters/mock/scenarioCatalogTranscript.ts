import { TRANSCRIPT_TASK_IDS } from './transcriptFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition, ScenarioId } from './scenarios'

function transcriptScenario(
  id: ScenarioId,
  mount: keyof typeof TRANSCRIPT_TASK_IDS,
  label: string,
  description: string,
  eventsPaneOpen = false,
): ScenarioDefinition {
  return base({
    id,
    label,
    description,
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TRANSCRIPT_TASK_IDS[mount],
      eventsPaneOpen,
    },
  })
}

/** Design 854caae task/transcript-* preview scenarios. */
export const TRANSCRIPT_SCENARIOS: readonly ScenarioDefinition[] = [
  transcriptScenario(
    'transcript-observed',
    'observed',
    'Transcript observed',
    'Design task/transcript-observed (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-loading',
    'loading',
    'Transcript loading',
    'Design task/transcript-loading (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-partial',
    'partial',
    'Transcript partial',
    'Design task/transcript-partial (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-unavailable',
    'unavailable',
    'Transcript unavailable',
    'Design task/transcript-unavailable (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-integrity-failed',
    'integrity-failed',
    'Transcript integrity failed',
    'Design task/transcript-integrity-failed (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-reconnecting',
    'reconnecting',
    'Transcript reconnecting',
    'Design task/transcript-reconnecting (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-capacity',
    'capacity',
    'Transcript capacity',
    'Design task/transcript-capacity (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-sources',
    'events',
    'Transcript sources',
    'Design task/transcript-sources (Design 854caae).',
  ),
  transcriptScenario(
    'transcript-observed-events',
    'observed',
    'Transcript observed · Events',
    'Design task/transcript-observed/events — Events pane open at load.',
    true,
  ),
]
