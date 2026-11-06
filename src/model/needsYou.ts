import type { TaskId } from './ids'

/**
 * Needs you is approvals and questions only.
 * A sidebar attention glyph is not an item in this observation.
 * Commands and paths are fixture copy, not this computer.
 */

export type NeedsYouTaskContext = {
  readonly kind: 'task'
  readonly title: string
  readonly waitingLabel: string
  /** Null stays unmapped. Never invent a fallback task. */
  readonly taskId: TaskId | null
}

export type NeedsYouWorkflowContext = {
  readonly kind: 'workflow'
  readonly title: string
  readonly step: string | null
  readonly waitingLabel: string
}

export type NeedsYouContext = NeedsYouTaskContext | NeedsYouWorkflowContext

/** One exact action. The label is not permission for the whole task. */
export type NeedsYouApproval = {
  readonly kind: 'approval'
  readonly id: string
  readonly actionLabel: string
  readonly exactAction: string
  readonly detail: string
  readonly context: NeedsYouContext
  readonly approveLabel: string
  readonly rejectLabel: string
}

export type NeedsYouQuestion = {
  readonly kind: 'question'
  readonly id: string
  readonly prompt: string
  readonly detail: string
  readonly context: NeedsYouTaskContext
}

export type NeedsYouItem = NeedsYouApproval | NeedsYouQuestion

export type NeedsYouObservation = {
  readonly coverage: 'complete' | 'partial'
  /** Required when coverage is partial. Null when complete. */
  readonly coverageNote: string | null
  readonly items: readonly NeedsYouItem[]
}

export type NeedsYouLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly observation: NeedsYouObservation }

/** Sidebar mark derived only from this observation. Unknown is not zero. */
export type NeedsYouBadge =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'clear' }
  | { readonly kind: 'count'; readonly count: number }
  | { readonly kind: 'partial'; readonly knownCount: number }

export function needsYouBadge(load: NeedsYouLoad): NeedsYouBadge {
  if (load.kind !== 'ready') return { kind: 'unknown' }
  if (load.observation.coverage === 'partial') {
    return { kind: 'partial', knownCount: load.observation.items.length }
  }
  if (load.observation.items.length === 0) return { kind: 'clear' }
  return { kind: 'count', count: load.observation.items.length }
}

export function needsYouContextText(context: NeedsYouContext): string {
  if (context.kind === 'task') {
    return `Task: ${context.title} · ${context.waitingLabel}`
  }
  const step = context.step ? ` · step ${context.step}` : ''
  return `Workflow: ${context.title}${step} · ${context.waitingLabel}`
}
