import type { TaskId } from './ids'
import type { TranscriptObservation } from './transcript'

/** Inline run of plain or code-styled text — never HTML. */
export type InlineRun =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'code'; readonly value: string }

export type AgentParagraph = {
  readonly kind: 'paragraph'
  readonly runs: readonly InlineRun[]
}

export type AgentList = {
  readonly kind: 'list'
  readonly items: readonly (readonly InlineRun[])[]
}

export type AgentSegment = AgentParagraph | AgentList

export type TaskFailureExplanation = {
  readonly title: string
  readonly intro: string
  readonly lastError: string
}

/** Approved summary section — fixture evidence only. */
export type TaskSummary = {
  readonly heading: string
  readonly segments: readonly AgentSegment[]
}

type TaskObservationBase = {
  readonly taskId: TaskId
  readonly title: string
  readonly statusBadge: string
  readonly headerMeta: string
  readonly followUpPlaceholder: string
  /** Design 854caae transcript surface (request, boundary, rows, live). */
  readonly transcript: TranscriptObservation
  /**
   * Which right-pane surface this observation supports.
   * Transcript redraws use Events; completed Changes fixture uses Changes.
   */
  readonly detailsPane: 'events' | 'changes' | null
}

/**
 * Explicit lifecycle. Failed/completed must not reuse running chrome.
 * Completed summary is reported fixture evidence — not independently verified
 * change/artifact/authorship proof.
 */
export type TaskObservation =
  | (TaskObservationBase & {
      readonly status: 'running'
    })
  | (TaskObservationBase & {
      readonly status: 'failed'
      readonly failure: TaskFailureExplanation
    })
  | (TaskObservationBase & {
      readonly status: 'completed'
      /** Present only when the specimen draws a summary (not the eight transcript states). */
      readonly summary?: TaskSummary
    })

export type TaskLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskObservation }
