import type { TaskId } from './ids'

/** Query identity for a stored events observation (newest page). */
export type TaskEventsQuery = {
  readonly taskId: TaskId
}

/** Older-page read: the opaque `older_cursor` of the page already shown. */
export type TaskEventsOlderQuery = {
  readonly taskId: TaskId
  readonly before: string
}

/**
 * One public normalized event or public stub. `kind` is the contract event
 * kind; `json` is the exact stored text shown in the disclosure.
 */
export type TaskEventsRecord = {
  readonly seq: number
  readonly kind: string
  readonly json: string
}

/** Contract `log.state` of the captured history. */
export type TaskEventsLogState =
  | 'open'
  | 'final'
  | 'settling'
  | 'incomplete'
  | 'unknown'
  | 'unavailable'

/**
 * Stored events observation (newest page) — domain facts only. Earlier-page
 * progress lives on the session, not here.
 */
export type TaskEventsObservation = {
  readonly taskId: TaskId
  readonly log: { readonly state: TaskEventsLogState }
  readonly records: readonly TaskEventsRecord[]
  readonly hasOlder: boolean
  /** Contract `older_cursor`; null at the start of the log. */
  readonly olderCursor: string | null
  /** Tool calls observed in captured history, when qualified. */
  readonly toolCallsObserved?: number
  /** A separate recovered-transcript source exists for this task. */
  readonly recoveredTranscript?: boolean
}

/** Contract refusal `task_pending_launch`: no task record exists yet. */
export type TaskEventsRefusal = {
  readonly kind: 'refused'
  readonly code: 'task_pending_launch'
  readonly launchState: string
}

export type TaskEventsLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | TaskEventsRefusal
  | { readonly kind: 'ready'; readonly observation: TaskEventsObservation }

/** One older page, ascending, to be shown above records already read. */
export type TaskEventsOlderPage = {
  readonly taskId: TaskId
  readonly records: readonly TaskEventsRecord[]
  readonly hasOlder: boolean
  readonly olderCursor: string | null
}

/**
 * Older-page answer. The cursor refusals mean: reload from the newest page
 * (contract `error.data.reload: "newest"`).
 */
export type TaskEventsOlderLoad =
  | { readonly kind: 'ready'; readonly page: TaskEventsOlderPage }
  | {
      readonly kind: 'refused'
      readonly code: 'event_cursor_expired' | 'event_cursor_invalid'
    }
  | { readonly kind: 'unavailable'; readonly message: string }
