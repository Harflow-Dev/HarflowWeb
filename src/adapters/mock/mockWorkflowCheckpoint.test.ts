import { describe, expect, it } from 'vitest'
import { createListenerSets } from './mockEngineCore'
import { createApprovalMutationStore } from './mockTaskApproval'
import {
  clearCheckpointMutations,
  createCheckpointMutationStore,
  mockAnswerWorkflowAttentionCheckpoint,
  mockRefreshWorkflowAttentionCheckpoint,
  seedCheckpointStaleAnswer,
} from './mockWorkflowCheckpoint'
import {
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
  NEEDS_YOU_PUBLISH_NODE_ID,
  NEEDS_YOU_PUBLISH_PATH,
  checkpointStaleNeedsYouLoad,
} from './needsYouApprovalFixtures'
import { scenarioById } from './scenarios'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'
import { NIGHTLY_PUBLISH_SNAPSHOT } from './nightlyPublishSnapshot'

describe('mockWorkflowCheckpoint', () => {
  it('refuses as checkpoint_stale then Refresh returns a new token', async () => {
    const checkpoints = createCheckpointMutationStore()
    const approvals = createApprovalMutationStore()
    seedCheckpointStaleAnswer(checkpoints, NIGHTLY_AUDIT_RUN_ID)
    const listeners = createListenerSets()
    const getScenario = () => {
      const base = scenarioById('needs-you-checkpoint-stale')
      return { ...base, needsYou: checkpointStaleNeedsYouLoad() }
    }
    const deps = { getScenario, listeners, checkpoints, approvals }

    const refused = await mockAnswerWorkflowAttentionCheckpoint(
      {
        workflowRunId: NIGHTLY_AUDIT_RUN_ID,
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
        decision: 'approve',
      },
      deps,
    )
    expect(refused).toEqual({ kind: 'checkpoint_stale' })

    const refreshed = await mockRefreshWorkflowAttentionCheckpoint(
      NIGHTLY_AUDIT_RUN_ID,
      deps,
    )
    expect(refreshed).toEqual({
      kind: 'checkpoint',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
      pending: [
        {
          attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
          nodeId: NEEDS_YOU_PUBLISH_NODE_ID,
          path: [...NEEDS_YOU_PUBLISH_PATH],
          nodeTitle: 'Open pull request',
          reason: 'Caller guidance required',
          status: 'paused',
          exactAction: NIGHTLY_PUBLISH_SNAPSHOT.publishAction,
        },
      ],
    })

    const accepted = await mockAnswerWorkflowAttentionCheckpoint(
      {
        workflowRunId: NIGHTLY_AUDIT_RUN_ID,
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
        decision: 'approve',
      },
      deps,
    )
    expect(accepted).toEqual({
      kind: 'accepted',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
    })
  })

  it('Refresh with the same token keeps the current token', async () => {
    const checkpoints = createCheckpointMutationStore()
    const approvals = createApprovalMutationStore()
    clearCheckpointMutations(checkpoints)
    checkpoints.tokens.set(NIGHTLY_AUDIT_RUN_ID, NEEDS_YOU_CHECKPOINT_TOKEN)
    const listeners = createListenerSets()
    const refreshed = await mockRefreshWorkflowAttentionCheckpoint(
      NIGHTLY_AUDIT_RUN_ID,
      {
        getScenario: () => scenarioById('needs-you-checkpoint-stale'),
        listeners,
        checkpoints,
        approvals,
      },
    )
    expect(refreshed.kind).toBe('checkpoint')
    if (refreshed.kind !== 'checkpoint') return
    expect(refreshed.attentionCheckpointId).toBe(NEEDS_YOU_CHECKPOINT_TOKEN)
    expect(refreshed.pending[0]?.attentionCheckpointId).toBe(
      NEEDS_YOU_CHECKPOINT_TOKEN,
    )
  })
})
