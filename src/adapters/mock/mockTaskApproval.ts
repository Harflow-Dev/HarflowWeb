/**
 * Mock respond / refresh for task approval ledgers.
 */
import {
  isAwaitingDecision,
  type ApprovalRespondOutcome,
  type ApprovalRespondRefusal,
  type RespondTaskApprovalRequest,
  type TaskApprovalRequest,
  type TaskId,
  type TaskLoad,
  type TaskObservation,
} from '../../model'
import {
  acceptedMonitorRequest,
  awaitingCountFor,
  TASK_APPROVAL_ENGINE_CURRENT,
} from './taskApprovalFixtures'
import { taskLoadFor } from './taskFixtures'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'

export type ApprovalMutationStore = {
  /** Per-task overridden approval row after a successful respond. */
  readonly overrides: Map<string, TaskApprovalRequest>
}

export function createApprovalMutationStore(): ApprovalMutationStore {
  return { overrides: new Map() }
}

export function clearApprovalMutations(store: ApprovalMutationStore): void {
  store.overrides.clear()
}

function applyOverride(
  load: TaskLoad,
  store: ApprovalMutationStore,
): TaskLoad {
  if (load.kind !== 'ready' || load.observation.approval === undefined) {
    return load
  }
  const override = store.overrides.get(load.observation.taskId)
  if (override === undefined) return load
  const observation: TaskObservation = {
    ...load.observation,
    approval: override,
    approvalSummary: { awaitingDecisionCount: awaitingCountFor(override) },
  }
  return { kind: 'ready', observation }
}

export function resolveTaskLoadWithApprovals(
  scenario: ScenarioDefinition,
  taskId: TaskId,
  store: ApprovalMutationStore,
): TaskLoad {
  const base =
    scenario.tasks === 'defer'
      ? ({ kind: 'loading' } as const)
      : scenario.tasks === 'default'
        ? taskLoadFor(taskId)
        : scenario.tasks(taskId)
  return applyOverride(base, store)
}

function publishTask(
  listeners: MockListenerSets,
  taskId: TaskId,
  load: TaskLoad,
): void {
  for (const listener of listeners.tasks) {
    if (listener.key === taskId) listener.send(load)
  }
}

/** The row the engine holds now, which may be ahead of what the feed showed. */
function engineRow(
  load: TaskLoad,
  taskId: TaskId,
  store: ApprovalMutationStore,
): TaskApprovalRequest | null {
  if (load.kind !== 'ready' || load.observation.approval === undefined) {
    return null
  }
  return (
    store.overrides.get(taskId) ??
    TASK_APPROVAL_ENGINE_CURRENT.get(taskId) ??
    load.observation.approval
  )
}

/**
 * Typed refusal for a respond, or null when it applies. Contract order:
 * identity / revision (not_current) before row state (expired, settled,
 * already_answered).
 */
function respondRefusal(
  current: TaskApprovalRequest,
  request: RespondTaskApprovalRequest,
): ApprovalRespondRefusal | null {
  if (
    current.requestId !== request.requestId ||
    current.ownerRevision !== request.ownerRevision ||
    current.actionDigest !== request.actionDigest
  ) {
    return { reason: 'not_current' }
  }
  if (isAwaitingDecision(current)) return null
  if (current.disposition === 'expired') return { reason: 'expired' }
  const humanAnswered =
    current.disposition === 'pending' &&
    current.decision !== null &&
    !current.expiryRejection &&
    current.decidedBy !== 'harflow'
  if (humanAnswered && current.decision !== null) {
    return {
      reason: 'already_answered',
      ...(current.decidedAt !== undefined && current.responder !== undefined
        ? {
            interaction: {
              answeredBy: current.responder,
              answer: current.decision,
              answeredAt: current.decidedAt,
            },
          }
        : {}),
    }
  }
  return { reason: 'settled' }
}

export async function mockRespondTaskApproval(
  request: RespondTaskApprovalRequest,
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  store: ApprovalMutationStore,
): Promise<ApprovalRespondOutcome> {
  const taskId = request.taskId as TaskId
  const load = resolveTaskLoadWithApprovals(getScenario(), taskId, store)
  const current = engineRow(load, taskId, store)
  if (current === null) {
    return { kind: 'refused', refusal: { reason: 'not_current' } }
  }
  const refusal = respondRefusal(current, request)
  if (refusal !== null) return { kind: 'refused', refusal }
  const next = acceptedMonitorRequest(current, request.decision)
  store.overrides.set(taskId, next)
  publishTask(
    listeners,
    taskId,
    resolveTaskLoadWithApprovals(getScenario(), taskId, store),
  )
  return { kind: 'accepted', request: next }
}

export async function mockRefreshTaskApproval(
  taskId: TaskId,
  requestId: string,
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  store: ApprovalMutationStore,
): Promise<TaskApprovalRequest | null> {
  const load = resolveTaskLoadWithApprovals(getScenario(), taskId, store)
  const current = engineRow(load, taskId, store)
  if (current === null || current.requestId !== requestId) return null
  // The feed catches up to the engine's row once it is re-read.
  store.overrides.set(taskId, current)
  publishTask(
    listeners,
    taskId,
    resolveTaskLoadWithApprovals(getScenario(), taskId, store),
  )
  return current
}
