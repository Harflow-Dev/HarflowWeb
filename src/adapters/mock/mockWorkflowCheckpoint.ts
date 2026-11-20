/**
 * Mock answer / refresh for workflow attention checkpoints on Needs you.
 */
import type {
  AnswerWorkflowAttentionCheckpointRequest,
  NeedsYouItem,
  NeedsYouLoad,
  NeedsYouObservation,
  NeedsYouWorkflowApproval,
  WorkflowCheckpointAnswerOutcome,
  WorkflowCheckpointRefreshResult,
  WorkflowRunId,
} from '../../model'
import { isNeedsYouWorkflowApproval } from '../../model'
import {
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
} from './needsYouApprovalFixtures'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'

export type CheckpointMutationStore = {
  /** Per-run token the feed currently shows / last accepted. */
  readonly tokens: Map<string, string>
  /** Engine-ahead token returned by Refresh (checkpoint-stale scenario). */
  readonly engineAhead: Map<string, string>
  /** Runs whose next matching answer refuses as attention_checkpoint_stale. */
  readonly staleOnAnswer: Set<string>
}

export function createCheckpointMutationStore(): CheckpointMutationStore {
  return {
    tokens: new Map(),
    engineAhead: new Map(),
    staleOnAnswer: new Set(),
  }
}

export function clearCheckpointMutations(store: CheckpointMutationStore): void {
  store.tokens.clear()
  store.engineAhead.clear()
  store.staleOnAnswer.clear()
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

function publishNeedsYou(
  listeners: MockListenerSets,
  load: NeedsYouLoad,
): void {
  for (const listener of listeners.needsYou) listener(load)
}

function withCheckpointToken(
  item: NeedsYouItem,
  runId: string,
  token: string,
): NeedsYouItem {
  if (!isNeedsYouWorkflowApproval(item)) return item
  if (item.context.runId !== runId) return item
  const next: NeedsYouWorkflowApproval = {
    ...item,
    attentionCheckpointId: token,
  }
  return next
}

function applyTokenToLoad(
  load: NeedsYouLoad,
  runId: string,
  token: string,
): NeedsYouLoad {
  if (load.kind !== 'ready') return load
  const items = load.observation.items.map((item) =>
    withCheckpointToken(item, runId, token),
  )
  const observation: NeedsYouObservation = { ...load.observation, items }
  return { kind: 'ready', observation }
}

function resolveNeedsYouLoad(scenario: ScenarioDefinition): NeedsYouLoad {
  return scenario.needsYou === 'defer'
    ? { kind: 'loading' }
    : scenario.needsYou
}

function currentToken(
  store: CheckpointMutationStore,
  runId: string,
): string {
  return store.tokens.get(runId) ?? NEEDS_YOU_CHECKPOINT_TOKEN
}

export async function mockAnswerWorkflowAttentionCheckpoint(
  request: AnswerWorkflowAttentionCheckpointRequest,
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  store: CheckpointMutationStore,
): Promise<WorkflowCheckpointAnswerOutcome> {
  const runId = request.workflowRunId
  const held = currentToken(store, runId)
  if (request.attentionCheckpointId !== held) {
    return { kind: 'checkpoint_stale' }
  }
  if (store.staleOnAnswer.has(runId)) {
    store.staleOnAnswer.delete(runId)
    return { kind: 'checkpoint_stale' }
  }
  store.tokens.set(runId, held)
  publishNeedsYou(listeners, resolveNeedsYouLoad(getScenario()))
  return { kind: 'accepted', attentionCheckpointId: held }
}

export async function mockRefreshWorkflowAttentionCheckpoint(
  workflowRunId: WorkflowRunId,
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  store: CheckpointMutationStore,
): Promise<WorkflowCheckpointRefreshResult> {
  const runId = workflowRunId as string
  if (runId !== (NIGHTLY_AUDIT_RUN_ID as string) && !store.tokens.has(runId)) {
    return { kind: 'absent' }
  }
  const ahead = store.engineAhead.get(runId)
  const token = ahead ?? currentToken(store, runId)
  if (ahead !== undefined) {
    store.tokens.set(runId, ahead)
    store.engineAhead.delete(runId)
  }
  const base = resolveNeedsYouLoad(getScenario())
  publishNeedsYou(listeners, applyTokenToLoad(base, runId, token))
  return { kind: 'checkpoint', attentionCheckpointId: token }
}
