/**
 * Workflow attention checkpoint answer / refresh.
 * Field names follow HarflowMCP contracts.md attention checkpoint tokens
 * and ctl-workflow-attention-*.json fixtures.
 */
import type { ApprovalDecision } from './taskApproval'

/** Parameters for answering one attention checkpoint through EnginePort. */
export type AnswerWorkflowAttentionCheckpointRequest = {
  readonly workflowRunId: string
  /** Contract: `attention_checkpoint_id`. */
  readonly attentionCheckpointId: string
  readonly decision: ApprovalDecision
}

/**
 * Typed top-level attention error codes other than `attention_checkpoint_stale`.
 * Design has no copy for these; presentation draws a neutral read-only line.
 */
export type WorkflowCheckpointRefusalCode =
  | 'interaction_already_answered'
  | 'attention_checkpoint_unavailable'
  | 'attention_checkpoint_required'

/** Winner carried on `interaction_already_answered` when present. */
export type WorkflowCheckpointInteraction = {
  readonly answeredBy: 'caller' | 'monitor'
  readonly answer: ApprovalDecision
  readonly answeredAt: number
}

/**
 * Outcome of an attention-checkpoint answer. `checkpoint_stale` is the typed
 * top-level `error.code: "attention_checkpoint_stale"`: the answer and grants
 * were not applied. `refused` covers other typed attention codes.
 * `unknown` means the call threw or timed out.
 */
export type WorkflowCheckpointAnswerOutcome =
  | { readonly kind: 'accepted'; readonly attentionCheckpointId: string }
  | { readonly kind: 'checkpoint_stale' }
  | {
      readonly kind: 'refused'
      readonly code: WorkflowCheckpointRefusalCode
      readonly interaction?: WorkflowCheckpointInteraction
    }
  | { readonly kind: 'unknown' }

/**
 * One `pending_attention` row projected for Needs you refresh matching.
 * Match cards by node id + path; the row's own token may differ from the
 * root `attention_checkpoint_id`.
 */
export type WorkflowCheckpointPendingProjection = {
  readonly attentionCheckpointId: string
  readonly nodeId: string
  readonly path: readonly string[]
  readonly nodeTitle: string | null
  readonly reason: string
  readonly status: string
  /** Action / exact-action prose drawn on the card. */
  readonly exactAction: string
  /**
   * Action label and meta (access / model) lines, only when the engine row
   * carries them. When absent on a changed token the card drops its old
   * meta line instead of keeping a stale one.
   */
  readonly actionLabel?: string
  readonly detail?: string
}

/**
 * Outcome of a read-only checkpoint refresh: pending-row projections for the
 * run, no such checkpoint, or a failed read (which learns nothing).
 */
export type WorkflowCheckpointRefreshResult =
  | {
      readonly kind: 'checkpoint'
      /** Root token when present; not used to match a card. */
      readonly attentionCheckpointId: string
      readonly pending: readonly WorkflowCheckpointPendingProjection[]
    }
  | { readonly kind: 'absent' }
  | { readonly kind: 'failed' }
