import { resolveScenarioRoute, TRANSCRIPT_BASES } from './scenarioRoute'
import { TRANSCRIPT_TASK_IDS } from './transcriptFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition, ScenarioId } from './scenarios'
import type { TranscriptMount } from './transcriptFixtureState'

const MOUNT_BY_BASE: Record<
  (typeof TRANSCRIPT_BASES)[number],
  TranscriptMount
> = {
  'transcript-observed': 'observed',
  'transcript-loading': 'loading',
  'transcript-partial': 'partial',
  'transcript-unavailable': 'unavailable',
  'transcript-integrity-failed': 'integrity-failed',
  'transcript-reconnecting': 'reconnecting',
  'transcript-capacity': 'capacity',
  'transcript-sources': 'events',
}

const LABELS: Record<(typeof TRANSCRIPT_BASES)[number], string> = {
  'transcript-observed': 'Transcript observed',
  'transcript-loading': 'Transcript loading',
  'transcript-partial': 'Transcript partial',
  'transcript-unavailable': 'Transcript unavailable',
  'transcript-integrity-failed': 'Transcript integrity failed',
  'transcript-reconnecting': 'Transcript reconnecting',
  'transcript-capacity': 'Transcript capacity',
  'transcript-sources': 'Transcript sources',
}

function transcriptScenario(
  id: ScenarioId,
  eventsPaneOpen: boolean,
): ScenarioDefinition {
  const resolved = resolveScenarioRoute(id)
  const baseId = (resolved?.transcriptBase ?? id) as (typeof TRANSCRIPT_BASES)[number]
  const mount = MOUNT_BY_BASE[baseId]
  return base({
    id,
    label: eventsPaneOpen ? `${LABELS[baseId]} · Events` : LABELS[baseId],
    description: eventsPaneOpen
      ? `Design task/${baseId}/events — Events pane open at load.`
      : `Design task/${baseId} (Design 854caae).`,
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: {
      openTaskId: TRANSCRIPT_TASK_IDS[mount],
      eventsPaneOpen,
    },
  })
}

/** Design 854caae task/transcript-* preview scenarios (closed + /events). */
export const TRANSCRIPT_SCENARIOS: readonly ScenarioDefinition[] = [
  ...TRANSCRIPT_BASES.map((id) => transcriptScenario(id, false)),
  ...TRANSCRIPT_BASES.map((id) =>
    transcriptScenario(`${id}/events` as ScenarioId, true),
  ),
]

/** Resolve a catalog or design route, including the `/events` suffix. */
export function transcriptScenarioFromRoute(
  raw: string,
): ScenarioDefinition | null {
  const resolved = resolveScenarioRoute(raw)
  if (!resolved?.transcriptBase) return null
  return transcriptScenario(
    (resolved.eventsPaneOpen
      ? `${resolved.transcriptBase}/events`
      : resolved.transcriptBase) as ScenarioId,
    resolved.eventsPaneOpen,
  )
}
