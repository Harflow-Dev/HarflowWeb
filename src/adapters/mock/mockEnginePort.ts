/**
 * Mock EnginePort assembly (observe + mutation callbacks).
 */
import type { EnginePort } from '../../application'
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
import { buildMockEngineObservePort } from './mockEngineObserve'
import type { MockListenerSets } from './mockEngineCore'

export function buildMockEnginePort(options: {
  readonly getScenario: Parameters<typeof buildMockEngineObservePort>[0]['getScenario']
  readonly listeners: MockListenerSets
  readonly onStart: (request: StartTaskRequest) => Promise<StartTaskOutcome>
  readonly resolveTask: (taskId: TaskId) => TaskLoad
  readonly onRespondApproval: (
    request: RespondTaskApprovalRequest,
  ) => Promise<ApprovalRespondOutcome>
  readonly onRefreshApproval: (
    taskId: TaskId,
    requestId: string,
  ) => Promise<TaskApprovalRequest | null>
  readonly onAnswerCheckpoint: (
    request: AnswerWorkflowAttentionCheckpointRequest,
  ) => Promise<WorkflowCheckpointAnswerOutcome>
  readonly onRefreshCheckpoint: (
    workflowRunId: WorkflowRunId,
  ) => Promise<WorkflowCheckpointRefreshResult>
}): EnginePort {
  const observe = buildMockEngineObservePort(options)
  const {
    onStart,
    onRespondApproval,
    onRefreshApproval,
    onAnswerCheckpoint,
    onRefreshCheckpoint,
  } = options
  return {
    ...observe,
    startTask(request) {
      return onStart(request)
    },
    respondTaskApproval(request) {
      return onRespondApproval(request)
    },
    refreshTaskApproval(taskId, requestId) {
      return onRefreshApproval(taskId, requestId)
    },
    answerWorkflowAttentionCheckpoint(request) {
      return onAnswerCheckpoint(request)
    },
    refreshWorkflowAttentionCheckpoint(workflowRunId) {
      return onRefreshCheckpoint(workflowRunId)
    },
  }
}