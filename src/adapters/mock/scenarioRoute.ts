import type { ScenarioId } from './scenarios'

const TRANSCRIPT_BASES = [
  'transcript-observed',
  'transcript-loading',
  'transcript-partial',
  'transcript-unavailable',
  'transcript-integrity-failed',
  'transcript-reconnecting',
  'transcript-capacity',
  'transcript-sources',
] as const satisfies readonly ScenarioId[]

export type TranscriptScenarioBase = (typeof TRANSCRIPT_BASES)[number]

export type ResolvedScenarioRoute = {
  readonly scenarioId: ScenarioId
  readonly eventsPaneOpen: boolean
  readonly transcriptBase: TranscriptScenarioBase | null
}

/**
 * Parse a preview / design route ref.
 * Accepts `transcript-observed`, `transcript-observed/events`,
 * `task/transcript-observed`, and `task/transcript-observed/events`.
 */
export function resolveScenarioRoute(raw: string): ResolvedScenarioRoute | null {
  const trimmed = raw.trim().replace(/^#/, '')
  if (!trimmed) return null
  const withoutTask = trimmed.startsWith('task/')
    ? trimmed.slice('task/'.length)
    : trimmed
  const eventsPaneOpen = withoutTask.endsWith('/events')
  const base = eventsPaneOpen
    ? withoutTask.slice(0, -'/events'.length)
    : withoutTask
  if (!(TRANSCRIPT_BASES as readonly string[]).includes(base)) {
    // Non-transcript scenario ids pass through without /events handling.
    if (eventsPaneOpen) return null
    return {
      scenarioId: base as ScenarioId,
      eventsPaneOpen: false,
      transcriptBase: null,
    }
  }
  return {
    scenarioId: base as TranscriptScenarioBase,
    eventsPaneOpen,
    transcriptBase: base as TranscriptScenarioBase,
  }
}

export function isTranscriptScenarioBase(
  id: string,
): id is TranscriptScenarioBase {
  return (TRANSCRIPT_BASES as readonly string[]).includes(id)
}

export { TRANSCRIPT_BASES }
