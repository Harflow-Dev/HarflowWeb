import { describe, expect, it } from 'vitest'
import { createListenerSets } from './mockEngineCore'
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
  checkpointStaleNeedsYouLoad,
} from './needsYouApprovalFixtures'
import { scenarioById } from './scenarios'
import { NIGHTLY_AUDIT_RUN_ID } from './workflowExecutionFixtures'

describe('mockWorkflowCheckpoint', () => {
  it('refuses as checkpoint_stale then Refresh returns a new token', async () => {
    const store = createCheckpointMutationStore()
    seedCheckpointStaleAnswer(store, NIGHTLY_AUDIT_RUN_ID)
    const listeners = createListenerSets()
    const getScenario = () => {
      const base = scenarioById('needs-you-checkpoint-stale')
      return { ...base, needsYou: checkpointStaleNeedsYouLoad() }
    }

    const refused = await mockAnswerWorkflowAttentionCheckpoint(
      {
        workflowRunId: NIGHTLY_AUDIT_RUN_ID,
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
        decision: 'approve',
      },
      getScenario,
      listeners,
      store,
    )
    expect(refused).toEqual({ kind: 'checkpoint_stale' })

    const refreshed = await mockRefreshWorkflowAttentionCheckpoint(
      NIGHTLY_AUDIT_RUN_ID,
      getScenario,
      listeners,
      store,
    )
    expect(refreshed).toEqual({
      kind: 'checkpoint',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
    })

    const accepted = await mockAnswerWorkflowAttentionCheckpoint(
      {
        workflowRunId: NIGHTLY_AUDIT_RUN_ID,
        attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
        decision: 'approve',
      },
      getScenario,
      listeners,
      store,
    )
    expect(accepted).toEqual({
      kind: 'accepted',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
    })
  })

  it('Refresh with the same token keeps the current token', async () => {
    const store = createCheckpointMutationStore()
    store.tokens.set(NIGHTLY_AUDIT_RUN_ID, NEEDS_YOU_CHECKPOINT_TOKEN)
    clearCheckpointMutations(store)
    store.tokens.set(NIGHTLY_AUDIT_RUN_ID, NEEDS_YOU_CHECKPOINT_TOKEN)
    const listeners = createListenerSets()
    const refreshed = await mockRefreshWorkflowAttentionCheckpoint(
      NIGHTLY_AUDIT_RUN_ID,
      () => scenarioById('needs-you-checkpoint-stale'),
      listeners,
      store,
    )
    expect(refreshed).toEqual({
      kind: 'checkpoint',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
    })
  })
})
