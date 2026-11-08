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

export type ToolSummaryPart =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'code'; readonly value: string }
  | { readonly kind: 'added'; readonly value: string }
  | { readonly kind: 'removed'; readonly value: string }

export type ToolBodyLine = {
  /**
   * Exact leading substring rendered with emphasis (e.g. FAILED or a path).
   * Null means the whole line is plain text.
   */
  readonly boldPrefix: string | null
  readonly text: string
}

export type ToolIcon = 'file' | 'terminal' | 'pencil'

export type TranscriptBlock =
  | {
      readonly kind: 'user'
      readonly id: string
      /** Literal plain text; render with pre-wrap, never as HTML. */
      readonly text: string
    }
  | {
      readonly kind: 'agent'
      readonly id: string
      readonly segments: readonly AgentSegment[]
    }
  | {
      readonly kind: 'tool'
      readonly id: string
      readonly icon: ToolIcon
      readonly summary: readonly ToolSummaryPart[]
      readonly meta: string
      readonly bodyLines: readonly ToolBodyLine[] | null
      readonly initiallyExpanded: boolean
    }
  | {
      readonly kind: 'working'
      readonly id: string
      readonly label: string
    }

export type TaskFailureExplanation = {
  readonly title: string
  readonly intro: string
  readonly lastError: string
}

/** Approved summary section inside the transcript — fixture evidence only. */
export type TaskSummary = {
  readonly heading: string
  readonly segments: readonly AgentSegment[]
}

type TaskObservationBase = {
  readonly taskId: TaskId
  readonly title: string
  readonly statusBadge: string
  readonly headerMeta: string
  readonly blocks: readonly TranscriptBlock[]
  readonly followUpPlaceholder: string
  /**
   * When set, the task screen renders the Design 854caae transcript surface
   * (request disclosure, boundary, rows, live region, Events pane) instead of
   * the superseded block-only layout.
   */
  readonly transcript: TranscriptObservation | null
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
      readonly summary: TaskSummary
    })

export type TaskLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskObservation }
