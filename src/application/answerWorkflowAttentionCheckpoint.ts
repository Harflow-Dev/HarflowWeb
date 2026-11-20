import type {
  AnswerWorkflowAttentionCheckpointRequest,
  WorkflowCheckpointAnswerOutcome,
} from '../model'
import type { EnginePort } from './enginePort'

export type AnswerWorkflowAttentionCheckpointUseCase = {
  execute(
    request: AnswerWorkflowAttentionCheckpointRequest,
  ): Promise<WorkflowCheckpointAnswerOutcome>
}

/**
 * A thrown or timed-out answer leaves the result uncertain: report
 * `unknown` so callers never resubmit.
 */
export function createAnswerWorkflowAttentionCheckpointUseCase(
  engine: EnginePort,
): AnswerWorkflowAttentionCheckpointUseCase {
  return {
    async execute(request) {
      try {
        return await engine.answerWorkflowAttentionCheckpoint(request)
      } catch {
        return { kind: 'unknown' }
      }
    },
  }
}
