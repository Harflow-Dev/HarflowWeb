/**
 * Mock respond / refresh for task approval ledgers.
 */
import type {
  ApprovalDecision,
  ApprovalRespondOutcome,
  RespondTaskApprovalRequest,
  TaskApprovalRequest,
  TaskId,
  TaskLoad,
  TaskObservation,
} from '../../model'
import { approvedSentRequest } from './taskApprovalFixtures'
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
  const awaiting =
    override.disposition === 'pending' &&
    override.delivery === 'pending' &&
    override.decision === null
      ? 1
      : 0
  const observation: TaskObservation = {
    ...load.observation,
    approval: override,
    approvalSummary: { awaitingDecisionCount: awaiting },
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

function rejectedRequest(
  base: TaskApprovalRequest,
  decision: ApprovalDecision,
): TaskApprovalRequest {
  if (decision === 'approve') return approvedSentRequest(base)
  return {
    ...base,
    disposition: 'decided',
    delivery: 'sent',
    decision: 'reject',
    decidedBy: 'caller',
    responder: 'caller',
    decidedAt: 1792000011,
    effectiveDecision: 'reject',
    deliveredDecision: 'reject',
    ownerRevision: base.ownerRevision + 1,
  }
}

export async function mockRespondTaskApproval(
  request: RespondTaskApprovalRequest,
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  store: ApprovalMutationStore,
): Promise<ApprovalRespondOutcome> {
  const taskId = request.taskId as TaskId
  const load = resolveTaskLoadWithApprovals(getScenario(), taskId, store)
  if (load.kind !== 'ready' || load.observation.approval === undefined) {
    return {
      kind: 'refused',
      refusal: { reason: 'not_current' },
    }
  }
  const current = load.observation.approval
  if (current.requestId !== request.requestId) {
    return { kind: 'refused', refusal: { reason: 'not_current' } }
  }
  if (
    current.disposition !== 'pending' ||
    current.delivery !== 'pending' ||
    current.decision !== null
  ) {
    return { kind: 'refused', refusal: { reason: 'settled' } }
  }
  if (current.ownerRevision !== request.ownerRevision) {
    return { kind: 'refused', refusal: { reason: 'not_current' } }
  }
  const next = rejectedRequest(current, request.decision)
  store.overrides.set(taskId, next)
  const nextLoad = resolveTaskLoadWithApprovals(getScenario(), taskId, store)
  publishTask(listeners, taskId, nextLoad)
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
  publishTask(listeners, taskId, load)
  if (load.kind !== 'ready' || load.observation.approval === undefined) {
    return null
  }
  if (load.observation.approval.requestId !== requestId) return null
  return load.observation.approval
}
