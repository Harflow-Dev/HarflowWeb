/**
 * Composed Needs you observation publish: merges every task-approval
 * override and drops answered checkpoint ids from one shared snapshot.
 */
import type {
  NeedsYouItem,
  NeedsYouLoad,
  NeedsYouObservation,
  NeedsYouTaskApproval,
  TaskApprovalRequest,
} from '../../model'
import {
  isNeedsYouTaskApproval,
  isNeedsYouWorkflowApproval,
} from '../../model'
import type { ApprovalMutationStore } from './mockTaskApproval'
import type { CheckpointMutationStore } from './mockWorkflowCheckpoint'
import type { MockListenerSets } from './mockEngineCore'
import type { ScenarioDefinition } from './scenarios'

export function resolveNeedsYouBaseLoad(
  scenario: ScenarioDefinition,
): NeedsYouLoad {
  return scenario.needsYou === 'defer'
    ? { kind: 'loading' }
    : scenario.needsYou
}

function dropAnsweredCheckpoints(
  load: NeedsYouLoad,
  store: CheckpointMutationStore,
): NeedsYouLoad {
  if (load.kind !== 'ready') return load
  if (store.answeredIds.size === 0) return load
  const items = load.observation.items.filter((item) => {
    if (!isNeedsYouWorkflowApproval(item)) return true
    return !store.answeredIds.has(item.attentionCheckpointId)
  })
  const observation: NeedsYouObservation = { ...load.observation, items }
  return { kind: 'ready', observation }
}

function withTaskRequest(
  item: NeedsYouItem,
  taskId: string,
  request: TaskApprovalRequest,
): NeedsYouItem {
  if (!isNeedsYouTaskApproval(item)) return item
  if (item.context.taskId !== taskId) return item
  const next: NeedsYouTaskApproval = {
    ...item,
    requestId: request.requestId,
    ownerRevision: request.ownerRevision,
    request,
  }
  return next
}

export function applyNeedsYouApprovalOverride(
  load: NeedsYouLoad,
  taskId: string,
  request: TaskApprovalRequest,
): NeedsYouLoad {
  if (load.kind !== 'ready') return load
  const items = load.observation.items.map((item) =>
    withTaskRequest(item, taskId, request),
  )
  const observation: NeedsYouObservation = { ...load.observation, items }
  return { kind: 'ready', observation }
}

function applyAllTaskOverrides(
  load: NeedsYouLoad,
  approvals: ApprovalMutationStore,
): NeedsYouLoad {
  let next = load
  for (const [taskId, request] of approvals.overrides) {
    next = applyNeedsYouApprovalOverride(next, taskId, request)
  }
  return next
}

/**
 * One composed Needs you publish from the current scenario plus every
 * task override, with answered checkpoint tokens removed.
 */
export function composedNeedsYouLoad(
  scenario: ScenarioDefinition,
  approvals: ApprovalMutationStore,
  checkpoints: CheckpointMutationStore,
): NeedsYouLoad {
  return dropAnsweredCheckpoints(
    applyAllTaskOverrides(resolveNeedsYouBaseLoad(scenario), approvals),
    checkpoints,
  )
}

export function publishComposedNeedsYou(
  getScenario: () => ScenarioDefinition,
  listeners: MockListenerSets,
  approvals: ApprovalMutationStore,
  checkpoints: CheckpointMutationStore,
): void {
  const next = composedNeedsYouLoad(getScenario(), approvals, checkpoints)
  for (const listener of listeners.needsYou) listener(next)
}