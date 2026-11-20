import { describe, expect, it, vi } from 'vitest'
import type { EnginePort } from './enginePort'
import { createRespondTaskApprovalUseCase } from './respondTaskApproval'
import { createRefreshTaskApprovalUseCase } from './refreshTaskApproval'
import type { TaskApprovalRequest } from '../model'
import { asTaskId } from '../model'

const REQUEST: TaskApprovalRequest = {
  requestId: 'req-1',
  ownerRevision: 1,
  actionDigest: 'digest',
  disposition: 'pending',
  delivery: 'pending',
  decision: null,
  effectiveDecision: null,
  deliveredDecision: null,
  expiryRejection: false,
  executionOutcome: 'unknown',
  scope: 'exact_action_once',
  toolName: 'Bash',
  action: 'echo hi',
  cwd: '/tmp',
  decisionReason: null,
}

function port(
  partial: Partial<EnginePort>,
): EnginePort {
  return partial as EnginePort
}

describe('respondTaskApproval use case', () => {
  it('forwards an accepted outcome', async () => {
    const accepted = {
      ...REQUEST,
      disposition: 'decided' as const,
      delivery: 'sent' as const,
      decision: 'approve' as const,
      effectiveDecision: 'approve' as const,
      deliveredDecision: 'approve' as const,
      responder: 'caller' as const,
    }
    const engine = port({
      respondTaskApproval: vi.fn(async () => ({
        kind: 'accepted' as const,
        request: accepted,
      })),
    })
    const outcome = await createRespondTaskApprovalUseCase(engine).execute({
      taskId: 'task-1',
      requestId: 'req-1',
      decision: 'approve',
      ownerRevision: 1,
      actionDigest: 'digest',
    })
    expect(outcome).toEqual({ kind: 'accepted', request: accepted })
  })

  it('forwards a typed refusal', async () => {
    const engine = port({
      respondTaskApproval: vi.fn(async () => ({
        kind: 'refused' as const,
        refusal: { reason: 'not_current' },
      })),
    })
    const outcome = await createRespondTaskApprovalUseCase(engine).execute({
      taskId: 'task-1',
      requestId: 'req-1',
      decision: 'approve',
      ownerRevision: 1,
      actionDigest: 'digest',
    })
    expect(outcome).toEqual({
      kind: 'refused',
      refusal: { reason: 'not_current' },
    })
  })

  it('maps thrown errors to unknown', async () => {
    const engine = port({
      respondTaskApproval: vi.fn(async () => {
        throw new Error('boom')
      }),
    })
    const outcome = await createRespondTaskApprovalUseCase(engine).execute({
      taskId: 'task-1',
      requestId: 'req-1',
      decision: 'reject',
      ownerRevision: 1,
      actionDigest: 'digest',
    })
    expect(outcome).toEqual({ kind: 'unknown' })
  })
})

describe('refreshTaskApproval use case', () => {
  it('returns the refreshed row', async () => {
    const engine = port({
      refreshTaskApproval: vi.fn(async () => REQUEST),
    })
    const row = await createRefreshTaskApprovalUseCase(engine).execute(
      asTaskId('task-1'),
      'req-1',
    )
    expect(row).toEqual({ kind: 'row', request: REQUEST })
  })

  it('tags a missing row as absent', async () => {
    const engine = port({ refreshTaskApproval: vi.fn(async () => null) })
    const row = await createRefreshTaskApprovalUseCase(engine).execute(
      asTaskId('task-1'),
      'req-1',
    )
    expect(row).toEqual({ kind: 'absent' })
  })

  it('tags a thrown read as failed', async () => {
    const engine = port({
      refreshTaskApproval: vi.fn(async () => {
        throw new Error('boom')
      }),
    })
    const row = await createRefreshTaskApprovalUseCase(engine).execute(
      asTaskId('task-1'),
      'req-1',
    )
    expect(row).toEqual({ kind: 'failed' })
  })
})
