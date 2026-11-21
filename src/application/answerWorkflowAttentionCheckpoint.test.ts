import { describe, expect, it, vi } from 'vitest'
import type { EnginePort } from './enginePort'
import { createAnswerWorkflowAttentionCheckpointUseCase } from './answerWorkflowAttentionCheckpoint'
import { createRefreshWorkflowAttentionCheckpointUseCase } from './refreshWorkflowAttentionCheckpoint'
import { asWorkflowRunId } from '../model'

function port(partial: Partial<EnginePort>): EnginePort {
  return partial as EnginePort
}

const REQUEST = {
  workflowRunId: 'run-nightly-dependency-audit',
  attentionCheckpointId:
    'attention:1111111111111111111111111111111111111111111111111111111111111111',
  decision: 'approve' as const,
}

describe('answerWorkflowAttentionCheckpoint use case', () => {
  it('forwards accepted and checkpoint_stale', async () => {
    const engine = port({
      answerWorkflowAttentionCheckpoint: vi.fn(async () => ({
        kind: 'accepted' as const,
        attentionCheckpointId: REQUEST.attentionCheckpointId,
      })),
    })
    const useCase = createAnswerWorkflowAttentionCheckpointUseCase(engine)
    expect(await useCase.execute(REQUEST)).toEqual({
      kind: 'accepted',
      attentionCheckpointId: REQUEST.attentionCheckpointId,
    })

    const stale = port({
      answerWorkflowAttentionCheckpoint: vi.fn(async () => ({
        kind: 'checkpoint_stale' as const,
      })),
    })
    expect(
      await createAnswerWorkflowAttentionCheckpointUseCase(stale).execute(
        REQUEST,
      ),
    ).toEqual({ kind: 'checkpoint_stale' })
  })

  it('maps thrown answers to unknown', async () => {
    const engine = port({
      answerWorkflowAttentionCheckpoint: vi.fn(async () => {
        throw new Error('timeout')
      }),
    })
    expect(
      await createAnswerWorkflowAttentionCheckpointUseCase(engine).execute(
        REQUEST,
      ),
    ).toEqual({ kind: 'unknown' })
  })
})

describe('refreshWorkflowAttentionCheckpoint use case', () => {
  it('forwards a checkpoint token', async () => {
    const engine = port({
      refreshWorkflowAttentionCheckpoint: vi.fn(async () => ({
        kind: 'checkpoint' as const,
        attentionCheckpointId: REQUEST.attentionCheckpointId,
        pending: [],
      })),
    })
    expect(
      await createRefreshWorkflowAttentionCheckpointUseCase(engine).execute(
        asWorkflowRunId(REQUEST.workflowRunId),
      ),
    ).toEqual({
      kind: 'checkpoint',
      attentionCheckpointId: REQUEST.attentionCheckpointId,
      pending: [],
    })
  })

  it('maps thrown refresh to failed', async () => {
    const engine = port({
      refreshWorkflowAttentionCheckpoint: vi.fn(async () => {
        throw new Error('down')
      }),
    })
    expect(
      await createRefreshWorkflowAttentionCheckpointUseCase(engine).execute(
        asWorkflowRunId(REQUEST.workflowRunId),
      ),
    ).toEqual({ kind: 'failed' })
  })
})
