import type { TaskId } from './ids'

/** Query identity for a stored events observation. */
export type TaskEventsQuery = {
  readonly taskId: TaskId
}

/**
 * One public normalized event, or a public stub. `json` is the exact stored
 * text shown in the disclosure — never reconstructed HTML.
 */
export type TaskEventsRecord = {
  readonly title: string
  readonly json: string
}

/** Captured-activity totals when the observation qualifies them. */
export type TaskEventsActivityFacts = {
  readonly toolCallsObserved: number
  readonly caption: string
}

/**
 * Captured-history log state. Empty does not qualify totals; unavailable is
 * not a task failure.
 */
export type TaskEventsLogState = 'available' | 'empty' | 'unavailable'

/**
 * Stored events observation — domain facts only. Earlier-page chrome
 * (`ui.loaded` / page error) lives on the session, not here.
 */
export type TaskEventsObservation = {
  readonly taskId: TaskId
  readonly activityFacts?: TaskEventsActivityFacts
  readonly records: readonly TaskEventsRecord[]
  readonly hasEarlier: boolean
  readonly earlierPage: readonly TaskEventsRecord[]
  readonly recoveredTranscriptNote?: boolean
  readonly logState: TaskEventsLogState
}

export type TaskEventsLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskEventsObservation }
