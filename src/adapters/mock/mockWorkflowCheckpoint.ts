/**
 * Mock answer / refresh for workflow attention checkpoints on Needs you.
 */
import type {
  AnswerWorkflowAttentionCheckpointRequest,
  NeedsYouItem,
  NeedsYouLoad,
  NeedsYouWorkflowApproval,
  WorkflowCheckpointAnswerOutcome,
  WorkflowCheckpointPendingProjection,
  WorkflowCheckpointRefreshResult,
  WorkflowRunId,
} from '../../model'
import { isNeedsYouWorkflowApproval } from '../../model'
import {
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
  nightlyPublishNeedsYouApproval,
} from './needsYouApprovalFixtures'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'
import type { ApprovalMutationStore } from './mockTaskApproval'
import {
  composedNeedsYouLoad,
  publishComposedNeedsYou,
} from './mockNeedsYouCompose'
import { NIGHTLY_PUBLISH_SNAPSHOT } from './nightlyPublishSnapshot'

export type CheckpointMutationStore = {
  /** Per-run token the feed currently shows / last accepted. */
  readonly tokens: Map<string, string>
  /** Engine-ahead token returned by Refresh (checkpoint-stale scenario). */
  readonly engineAhead: Map<string, string>
  /** Runs whose next matching answer refuses as attention_checkpoint_stale. */
  readonly staleOnAnswer: Set<string>
  /** Attention checkpoint ids already answered this session. */
  readonly answeredIds: Set<string>
  /** Optional next exact-action prose after a token rotate. */
  readonly nextExactAction: Map<string, string>
}

export function createCheckpointMutationStore(): CheckpointMutationStore {
  return {
    tokens: new Map(),
    engineAhead: new Map(),
    staleOnAnswer: new Set(),
    answeredIds: new Set(),
    nextExactAction: new Map(),
  }
}

export function clearCheckpointMutations(store: CheckpointMutationStore): void {
  store.tokens.clear()
  store.engineAhead.clear()
  store.staleOnAnswer.clear()
  store.answeredIds.clear()
  store.nextExactAction.clear()
}

/**
 * Seed a run so the next answer with the current token returns
 * checkpoint_stale, and Refresh returns `nextToken`.
 */
export function seedCheckpointStaleAnswer(
  store: CheckpointMutationStore,
  runId: string,
  currentToken: string = NEEDS_YOU_CHECKPOINT_TOKEN,
  nextToken: string = NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
): void {
  store.tokens.set(runId, currentToken)
  store.engineAhead.set(runId, nextToken)
  store.staleOnAnswer.add(runId)
}

function currentToken(
  store: CheckpointMutationStore,
  runId: string,
): string {
  return store.tokens.get(runId) ?? NEEDS_YOU_CHECKPOINT_TOKEN
}

function pendingProjectionFor(
  store: CheckpointMutationStore,
  runId: string,
  token: string,
  baseItem: NeedsYouWorkflowApproval,
): WorkflowCheckpointPendingProjection {
  const exactAction =
    store.nextExactAction.get(runId) ?? baseItem.exactAction
  return {
    attentionCheckpointId: token,
    nodeId: baseItem.nodeId,
    path: [...baseItem.path],
    nodeTitle: baseItem.context.step,
    reason: 'Caller guidance required',
    status: 'paused',
    exactAction,
    actionLabel: baseItem.actionLabel,
    detail: baseItem.detail,
  }
}

function findPublishItem(load: NeedsYouLoad): NeedsYouWorkflowApproval | null {
  if (load.kind !== 'ready') return null
  return load.observation.items.find(isNeedsYouWorkflowApproval) ?? null
}

function withCheckpointProjection(
  item: NeedsYouItem,
  runId: string,
  projection: WorkflowCheckpointPendingProjection,
): NeedsYouItem {
  if (!isNeedsYouWorkflowApproval(item)) return item
  if (item.context.runId !== runId) return item
  if (item.nodeId !== projection.nodeId) return item
  return {
    ...item,
    attentionCheckpointId: projection.attentionCheckpointId,
    exactAction: projection.exactAction,
    actionLabel: projection.actionLabel ?? item.actionLabel,
    detail: projection.detail ?? item.detail,
    context: {
      ...item.context,
      step: projection.nodeTitle ?? item.context.step,
    },
  }
}

function applyProjectionToLoad(
  load: NeedsYouLoad,
  runId: string,
  projection: WorkflowCheckpointPendingProjection,
): NeedsYouLoad {
  if (load.kind !== 'ready') return load
  const items = load.observation.items.map((item) =>
    withCheckpointProjection(item, runId, projection),
  )
  return { kind: 'ready', observation: { ...load.observation, items } }
}

export type CheckpointMockDeps = {
  readonly getScenario: () => ScenarioDefinition
  readonly listeners: MockListenerSets
  readonly checkpoints: CheckpointMutationStore
  readonly approvals: ApprovalMutationStore
}

export async function mockAnswerWorkflowAttentionCheckpoint(
  request: AnswerWorkflowAttentionCheckpointRequest,
  deps: CheckpointMockDeps,
): Promise<WorkflowCheckpointAnswerOutcome> {
  const { getScenario, listeners, checkpoints, approvals } = deps
  const runId = request.workflowRunId
  const held = currentToken(checkpoints, runId)
  if (request.attentionCheckpointId !== held) {
    return { kind: 'checkpoint_stale' }
  }
  if (checkpoints.staleOnAnswer.has(runId)) {
    checkpoints.staleOnAnswer.delete(runId)
    return { kind: 'checkpoint_stale' }
  }
  checkpoints.tokens.set(runId, held)
  checkpoints.answeredIds.add(held)
  publishComposedNeedsYou(getScenario, listeners, approvals, checkpoints)
  return { kind: 'accepted', attentionCheckpointId: held }
}

export async function mockRefreshWorkflowAttentionCheckpoint(
  workflowRunId: WorkflowRunId,
  deps: CheckpointMockDeps,
): Promise<WorkflowCheckpointRefreshResult> {
  const { getScenario, listeners, checkpoints, approvals } = deps
  const runId = workflowRunId as string
  if (
    runId !== (NIGHTLY_AUDIT_RUN_ID as string) &&
    !checkpoints.tokens.has(runId)
  ) {
    return { kind: 'absent' }
  }
  const ahead = checkpoints.engineAhead.get(runId)
  const token = ahead ?? currentToken(checkpoints, runId)
  if (ahead !== undefined) {
    checkpoints.tokens.set(runId, ahead)
    checkpoints.engineAhead.delete(runId)
  }
  const base = composedNeedsYouLoad(getScenario(), approvals, checkpoints)
  const existing = findPublishItem(base)
  const template =
    existing ??
    nightlyPublishNeedsYouApproval(
      token,
      NIGHTLY_PUBLISH_SNAPSHOT.publishAction,
    )
  const projection = pendingProjectionFor(checkpoints, runId, token, template)
  const next =
    existing === null
      ? base
      : applyProjectionToLoad(base, runId, projection)
  for (const listener of listeners.needsYou) listener(next)
  return {
    kind: 'checkpoint',
    attentionCheckpointId: token,
    pending: [projection],
  }
}
