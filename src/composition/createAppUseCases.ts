import {
  createLoadContextUseCase,
  createLoadHarnessesUseCase,
  createLoadNeedsYouUseCase,
  createLoadParallelGroupUseCase,
  createLoadMessagingCapabilityUseCase,
  createLoadPendingLaunchCapabilityUseCase,
  createLoadPendingLaunchInventoryUseCase,
  createLoadPendingLaunchStatusUseCase,
  createLoadResourcesUseCase,
  createLoadSettingsGeneralUseCase,
  createLoadStatisticsUseCase,
  createLoadTaskChangesUseCase,
  createLoadTaskEventsUseCase,
  createLoadTaskUseCase,
  createLoadWorkflowEditorUseCase,
  createLoadWorkflowExecutionUseCase,
  createLoadWorkflowRunUseCase,
  createLoadWorkflowsUseCase,
  createAnswerWorkflowAttentionCheckpointUseCase,
  createRefreshTaskApprovalUseCase,
  createRefreshWorkflowAttentionCheckpointUseCase,
  createRespondTaskApprovalUseCase,
  createStartTaskUseCase,
  type EnginePort,
} from '../application'
import type { AppSessionDeps } from '../presentation/appChildSessions'

/** Build the use-case bag composition passes to the app presenter. */
export function createAppUseCases(engine: EnginePort): AppSessionDeps {
  return {
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
    loadWorkflows: createLoadWorkflowsUseCase(engine),
    loadResources: createLoadResourcesUseCase(engine),
    loadStatistics: createLoadStatisticsUseCase(engine),
    loadTask: createLoadTaskUseCase(engine),
    loadTaskChanges: createLoadTaskChangesUseCase(engine),
    loadTaskEvents: createLoadTaskEventsUseCase(engine),
    respondTaskApproval: createRespondTaskApprovalUseCase(engine),
    refreshTaskApproval: createRefreshTaskApprovalUseCase(engine),
    answerWorkflowAttentionCheckpoint:
      createAnswerWorkflowAttentionCheckpointUseCase(engine),
    refreshWorkflowAttentionCheckpoint:
      createRefreshWorkflowAttentionCheckpointUseCase(engine),
    loadHarnesses: createLoadHarnessesUseCase(engine),
    loadSettingsGeneral: createLoadSettingsGeneralUseCase(engine),
    loadNeedsYou: createLoadNeedsYouUseCase(engine),
    loadWorkflowRun: createLoadWorkflowRunUseCase(engine),
    loadWorkflowEditor: createLoadWorkflowEditorUseCase(engine),
    loadWorkflowExecution: createLoadWorkflowExecutionUseCase(engine),
    loadParallelGroup: createLoadParallelGroupUseCase(engine),
    loadMessagingCapability: createLoadMessagingCapabilityUseCase(engine),
    loadPendingLaunchCapability:
      createLoadPendingLaunchCapabilityUseCase(engine),
    loadPendingLaunchInventory: createLoadPendingLaunchInventoryUseCase(engine),
    loadPendingLaunchStatus: createLoadPendingLaunchStatusUseCase(engine),
  }
}
