import type { TaskId } from './ids'

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
  /** When true, the leading token is rendered with emphasis (e.g. FAILED). */
  readonly failedLead: boolean
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

export type TaskObservation = {
  readonly taskId: TaskId
  readonly title: string
  readonly runningBadge: string
  readonly headerMeta: string
  readonly blocks: readonly TranscriptBlock[]
  readonly followUpPlaceholder: string
}

export type TaskLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: TaskObservation }
