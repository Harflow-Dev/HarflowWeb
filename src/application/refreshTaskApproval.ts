import type { ApprovalRefreshResult, TaskId } from '../model'
import type { EnginePort } from './enginePort'

export type RefreshTaskApprovalUseCase = {
  execute(taskId: TaskId, requestId: string): Promise<ApprovalRefreshResult>
}

export function createRefreshTaskApprovalUseCase(
  engine: EnginePort,
): RefreshTaskApprovalUseCase {
  return {
    async execute(taskId, requestId) {
      try {
        const request = await engine.refreshTaskApproval(taskId, requestId)
        return request === null
          ? { kind: 'absent' }
          : { kind: 'row', request }
      } catch {
        return { kind: 'failed' }
      }
    },
  }
}
