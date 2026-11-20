import type {
  ApprovalRespondOutcome,
  RespondTaskApprovalRequest,
} from '../model'
import type { EnginePort } from './enginePort'

export type RespondTaskApprovalUseCase = {
  execute(request: RespondTaskApprovalRequest): Promise<ApprovalRespondOutcome>
}

/**
 * A thrown or timed-out respond leaves the result uncertain: report
 * `unknown` so callers never resubmit.
 */
export function createRespondTaskApprovalUseCase(
  engine: EnginePort,
): RespondTaskApprovalUseCase {
  return {
    async execute(request) {
      try {
        return await engine.respondTaskApproval(request)
      } catch {
        return { kind: 'unknown' }
      }
    },
  }
}
