import type {
  ApprovalRespondOutcome,
  RespondTaskApprovalRequest,
} from '../model'
import type { EnginePort } from './enginePort'

export type RespondTaskApprovalUseCase = {
  execute(request: RespondTaskApprovalRequest): Promise<ApprovalRespondOutcome>
}

export function createRespondTaskApprovalUseCase(
  engine: EnginePort,
): RespondTaskApprovalUseCase {
  return {
    async execute(request) {
      try {
        return await engine.respondTaskApproval(request)
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : 'engine respondTaskApproval rejected'
        return {
          kind: 'unknown',
          message: `fixture: owner did not report; ${detail}`,
        }
      }
    },
  }
}
