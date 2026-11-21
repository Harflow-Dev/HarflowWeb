import type {
  AnswerWorkflowAttentionCheckpointRequest,
  ApprovalRespondOutcome,
  RespondTaskApprovalRequest,
  StartTaskOutcome,
  StartTaskRequest,
  TaskApprovalRequest,
  TaskId,
  TaskLoad,
  WorkflowCheckpointAnswerOutcome,
  WorkflowCheckpointRefreshResult,
  WorkflowRunId,
} from '../../model'
import type { MockListenerSets } from './mockEngineCore'
import {
  clearApprovalMutations,
  createApprovalMutationStore,
  mockRefreshTaskApproval,
  mockRespondTaskApproval,
  resolveTaskLoadWithApprovals,
  type ApprovalMutationStore,
} from './mockTaskApproval'
import { seedNeedsYouApprovalOverrides } from './mockNeedsYouApprovals'
import {
  clearCheckpointMutations,
  createCheckpointMutationStore,
  mockAnswerWorkflowAttentionCheckpoint,
  mockRefreshWorkflowAttentionCheckpoint,
  seedCheckpointStaleAnswer,
  type CheckpointMutationStore,
} from './mockWorkflowCheckpoint'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'
import { scenarioById, type ScenarioDefinition, type ScenarioId } from './scenarios'

export type MockEngineRuntime = {
  getScenario: () => ScenarioDefinition
  setScenarioRef: (next: ScenarioDefinition) => void
  approvals: ApprovalMutationStore
  checkpoints: CheckpointMutationStore
  listeners: MockListenerSets
  onStartTracked: (request: StartTaskRequest) => Promise<StartTaskOutcome>
}

export function createMockEngineRuntime(
  initialScenario: ScenarioId,
  listeners: MockListenerSets,
  trackStart: {
    onRequest: (request: StartTaskRequest) => void
    heldStart: () => { promise: Promise<StartTaskOutcome> }
  },
): MockEngineRuntime {
  let scenario = scenarioById(initialScenario)
  const approvals = createApprovalMutationStore()
  const checkpoints = createCheckpointMutationStore()

  function applyScenario(next: ScenarioDefinition): void {
    scenario = next
    clearApprovalMutations(approvals)
    clearCheckpointMutations(checkpoints)
    seedNeedsYouApprovalOverrides(scenario, approvals)
    if (scenario.id === 'needs-you-checkpoint-stale') {
      seedCheckpointStaleAnswer(checkpoints, NIGHTLY_AUDIT_RUN_ID)
    }
  }
  applyScenario(scenario)

  return {
    getScenario: () => scenario,
    setScenarioRef: (next) => {
      applyScenario(next)
    },
    approvals,
    checkpoints,
    listeners,
    onStartTracked: async (request) => {
      trackStart.onRequest(request)
      if (scenario.holdStart) return trackStart.heldStart().promise
      return scenario.startOutcome
    },
  }
}

export function mockEnginePortCallbacks(runtime: MockEngineRuntime): {
  resolveTask: (taskId: TaskId) => TaskLoad
  onRespondApproval: (
    request: RespondTaskApprovalRequest,
  ) => Promise<ApprovalRespondOutcome>
  onRefreshApproval: (
    taskId: TaskId,
    requestId: string,
  ) => Promise<TaskApprovalRequest | null>
  onAnswerCheckpoint: (
    request: AnswerWorkflowAttentionCheckpointRequest,
  ) => Promise<WorkflowCheckpointAnswerOutcome>
  onRefreshCheckpoint: (
    workflowRunId: WorkflowRunId,
  ) => Promise<WorkflowCheckpointRefreshResult>
} {
  const { getScenario, listeners, approvals, checkpoints } = runtime
  const checkpointDeps = {
    getScenario,
    listeners,
    checkpoints,
    approvals,
  }
  return {
    resolveTask: (taskId) =>
      resolveTaskLoadWithApprovals(getScenario(), taskId, approvals),
    onRespondApproval: (request) =>
      mockRespondTaskApproval(
        request,
        getScenario,
        listeners,
        approvals,
        checkpoints,
      ),
    onRefreshApproval: (taskId, requestId) =>
      mockRefreshTaskApproval(
        taskId,
        requestId,
        getScenario,
        listeners,
        approvals,
        checkpoints,
      ),
    onAnswerCheckpoint: (request) =>
      mockAnswerWorkflowAttentionCheckpoint(request, checkpointDeps),
    onRefreshCheckpoint: (workflowRunId) =>
      mockRefreshWorkflowAttentionCheckpoint(workflowRunId, checkpointDeps),
  }
}