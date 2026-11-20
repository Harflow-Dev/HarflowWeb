import type { TaskId, WorkflowRunId } from './ids'
import {
  isAwaitingDecision,
  type TaskApprovalRequest,
} from './taskApproval'

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
  /** Null stays unmapped. A definition id is not a run id. */
  readonly runId: WorkflowRunId | null
}

export type NeedsYouContext = NeedsYouTaskContext | NeedsYouWorkflowContext

type NeedsYouApprovalBase = {
  readonly kind: 'approval'
  readonly id: string
  readonly actionLabel: string
  readonly exactAction: string
  readonly detail: string
  readonly approveLabel: string
  readonly rejectLabel: string
}

/**
 * Task approval on Needs you: identity needed to respond plus the ledger row
 * the card is drawn from. Contract field names via `request` / `requestId` /
 * `ownerRevision`.
 */
export type NeedsYouTaskApproval = NeedsYouApprovalBase & {
  readonly context: NeedsYouTaskContext
  readonly requestId: string
  readonly ownerRevision: number
  readonly request: TaskApprovalRequest
}

/**
 * Workflow attention checkpoint on Needs you. Contract:
 * `attention_checkpoint_id` (and `runId` from context).
 */
export type NeedsYouWorkflowApproval = NeedsYouApprovalBase & {
  readonly context: NeedsYouWorkflowContext
  readonly attentionCheckpointId: string
}

/** One exact action. The label is not permission for the whole task. */
export type NeedsYouApproval = NeedsYouTaskApproval | NeedsYouWorkflowApproval

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

/** True when the item still needs a human decision in the observation. */
export function isNeedsYouWaitingItem(item: NeedsYouItem): boolean {
  if (item.kind === 'question') return true
  if (item.context.kind === 'workflow') return true
  if (!isNeedsYouTaskApproval(item)) return true
  return isAwaitingDecision(item.request)
}

export function needsYouWaitingCount(
  items: readonly NeedsYouItem[],
): number {
  return items.filter(isNeedsYouWaitingItem).length
}

export function needsYouBadge(load: NeedsYouLoad): NeedsYouBadge {
  if (load.kind !== 'ready') return { kind: 'unknown' }
  if (load.observation.coverage === 'partial') {
    return {
      kind: 'partial',
      knownCount: needsYouWaitingCount(load.observation.items),
    }
  }
  const waiting = needsYouWaitingCount(load.observation.items)
  if (waiting === 0) return { kind: 'clear' }
  return { kind: 'count', count: waiting }
}

export function needsYouContextText(context: NeedsYouContext): string {
  if (context.kind === 'task') {
    return `Task: ${context.title} · ${context.waitingLabel}`
  }
  const step = context.step ? ` · step ${context.step}` : ''
  return `Workflow: ${context.title}${step} · ${context.waitingLabel}`
}

export function isNeedsYouTaskApproval(
  item: NeedsYouItem,
): item is NeedsYouTaskApproval {
  return item.kind === 'approval' && item.context.kind === 'task'
}

export function isNeedsYouWorkflowApproval(
  item: NeedsYouItem,
): item is NeedsYouWorkflowApproval {
  return item.kind === 'approval' && item.context.kind === 'workflow'
}
