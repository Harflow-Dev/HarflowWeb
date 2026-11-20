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
 * Outcome of an attention-checkpoint answer. `checkpoint_stale` is the typed
 * top-level `error.code: "attention_checkpoint_stale"`: the answer and grants
 * were not applied. `unknown` means the call threw or timed out.
 */
export type WorkflowCheckpointAnswerOutcome =
  | { readonly kind: 'accepted'; readonly attentionCheckpointId: string }
  | { readonly kind: 'checkpoint_stale' }
  | { readonly kind: 'unknown' }

/**
 * Outcome of a read-only checkpoint refresh: the current token, no such
 * checkpoint, or a failed read (which learns nothing).
 */
export type WorkflowCheckpointRefreshResult =
  | { readonly kind: 'checkpoint'; readonly attentionCheckpointId: string }
  | { readonly kind: 'absent' }
  | { readonly kind: 'failed' }
