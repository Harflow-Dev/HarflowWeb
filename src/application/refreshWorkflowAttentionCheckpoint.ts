import type {
  WorkflowCheckpointRefreshResult,
  WorkflowRunId,
} from '../model'
import type { EnginePort } from './enginePort'

export type RefreshWorkflowAttentionCheckpointUseCase = {
  execute(workflowRunId: WorkflowRunId): Promise<WorkflowCheckpointRefreshResult>
}

/**
 * A thrown refresh learns nothing: report `failed` so the stale card stays.
 */
export function createRefreshWorkflowAttentionCheckpointUseCase(
  engine: EnginePort,
): RefreshWorkflowAttentionCheckpointUseCase {
  return {
    async execute(workflowRunId) {
      try {
        return await engine.refreshWorkflowAttentionCheckpoint(workflowRunId)
      } catch {
        return { kind: 'failed' }
      }
    },
  }
}