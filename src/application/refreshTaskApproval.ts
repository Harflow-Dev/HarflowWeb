import type { TaskApprovalRequest, TaskId } from '../model'
import type { EnginePort } from './enginePort'

export type RefreshTaskApprovalUseCase = {
  execute(
    taskId: TaskId,
    requestId: string,
  ): Promise<TaskApprovalRequest | null>
}

export function createRefreshTaskApprovalUseCase(
  engine: EnginePort,
): RefreshTaskApprovalUseCase {
  return {
    async execute(taskId, requestId) {
      try {
        return await engine.refreshTaskApproval(taskId, requestId)
      } catch {
        return null
      }
    },
  }
}
