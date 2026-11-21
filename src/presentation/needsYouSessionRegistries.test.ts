import { describe, expect, it } from 'vitest'
import {
  createLoadNeedsYouUseCase,
  type AnswerWorkflowAttentionCheckpointUseCase,
  type EnginePort,
  type RefreshWorkflowAttentionCheckpointUseCase,
} from '../application'
import {
  nightlyPublishNeedsYouApproval,
  NEEDS_YOU_CHECKPOINT_TOKEN,
  NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
  NEEDS_YOU_APPROVAL_TASK_ID,
  slotReleaseNeedsYouApproval,
} from '../adapters/mock/needsYouApprovalFixtures'
import { NIGHTLY_AUDIT_RUN_ID } from '../adapters/mock/workflowExecutionFixtures'
import type {
  NeedsYouLoad,
  WorkflowCheckpointAnswerOutcome,
  WorkflowCheckpointRefreshResult,
} from '../model'
import { asObservationId, isNeedsYouWorkflowApproval } from '../model'
import { needsYouCheckpointCardView } from './needsYouCheckpointCardView'
import { NeedsYouSession } from './needsYouSession'
import { TaskApprovalRegistry } from './taskApprovalRegistry'

const TASK_ITEM = slotReleaseNeedsYouApproval()
const CHECKPOINT_ITEM = nightlyPublishNeedsYouApproval()

const LOAD: NeedsYouLoad = {
  kind: 'ready',
  observation: {
    coverage: 'complete',
    coverageNote: null,
    items: [TASK_ITEM, CHECKPOINT_ITEM],
  },
}

function engineFor(load: NeedsYouLoad): {
  engine: EnginePort
  publish: (next: NeedsYouLoad) => void
} {
  let listener: ((load: NeedsYouLoad) => void) | null = null
  const engine = {
    observeNeedsYou(onUpdate: (load: NeedsYouLoad) => void) {
      listener = onUpdate
      queueMicrotask(() => onUpdate(load))
      return { id: asObservationId('needs'), cancel() {} }
    },
  } as EnginePort
  return { engine, publish: (next) => listener?.(next) }
}

type Deferred<T> = { promise: Promise<T>; resolve(value: T): void }

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

type Harness = {
  readonly session: NeedsYouSession
  readonly registry: TaskApprovalRegistry
  readonly publish: (next: NeedsYouLoad) => void
  readonly answer: Deferred<WorkflowCheckpointAnswerOutcome>
  readonly refresh: Deferred<WorkflowCheckpointRefreshResult>
}

async function harness(): Promise<Harness> {
  const { engine, publish } = engineFor(LOAD)
  const answer = deferred<WorkflowCheckpointAnswerOutcome>()
  const refresh = deferred<WorkflowCheckpointRefreshResult>()
  const answerUseCase: AnswerWorkflowAttentionCheckpointUseCase = {
    execute: () => answer.promise,
  }
  const refreshUseCase: RefreshWorkflowAttentionCheckpointUseCase = {
    execute: () => refresh.promise,
  }
  const registry = new TaskApprovalRegistry()
  const session = new NeedsYouSession(
    createLoadNeedsYouUseCase(engine),
    registry,
    { execute: async () => ({ kind: 'unknown' }) },
    { execute: async () => ({ kind: 'absent' }) },
    answerUseCase,
    refreshUseCase,
  )
  session.start()
  await Promise.resolve()
  return { session, registry, publish, answer, refresh }
}

function submitting(h: Harness): readonly string[] {
  return h.session.getState().chrome.submittingItemIds
}

describe('Needs you in-flight state comes from the registries', () => {
  it('shows a respond started on the task screen as submitting, across a restart', async () => {
    const h = await harness()
    expect(submitting(h)).toEqual([])
    h.registry.beginRespond(
      NEEDS_YOU_APPROVAL_TASK_ID,
      TASK_ITEM.requestId,
    )
    expect(submitting(h)).toEqual([TASK_ITEM.id])
    h.session.start()
    await Promise.resolve()
    expect(submitting(h)).toEqual([TASK_ITEM.id])
    h.registry.endRespond(NEEDS_YOU_APPROVAL_TASK_ID, TASK_ITEM.requestId)
    expect(submitting(h)).toEqual([])
  })

  it('keeps a checkpoint answer in flight across a screen restart', async () => {
    const h = await harness()
    h.session.answerCheckpoint(CHECKPOINT_ITEM.id, 'approve')
    expect(submitting(h)).toEqual([CHECKPOINT_ITEM.id])
    h.session.start()
    await Promise.resolve()
    expect(submitting(h)).toEqual([CHECKPOINT_ITEM.id])
    h.answer.resolve({
      kind: 'accepted',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(submitting(h)).toEqual([])
  })

  it('discards a refresh that lands while an answer is in flight', async () => {
    const h = await harness()
    h.session.refreshCheckpoint(CHECKPOINT_ITEM.id)
    h.session.answerCheckpoint(CHECKPOINT_ITEM.id, 'approve')
    h.refresh.resolve({
      kind: 'checkpoint',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
      pending: [
        {
          attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
          nodeId: CHECKPOINT_ITEM.nodeId,
          path: [...CHECKPOINT_ITEM.path],
          nodeTitle: 'Open pull request',
          reason: 'Caller guidance required',
          status: 'paused',
          workflowName: null,
        },
      ],
    })
    await Promise.resolve()
    await Promise.resolve()
    const card = h.session
      .getState()
      .displayItems.find((item) => item.id === CHECKPOINT_ITEM.id)
    expect(
      card !== undefined && isNeedsYouWorkflowApproval(card)
        ? card.attentionCheckpointId
        : null,
    ).toBe(NEEDS_YOU_CHECKPOINT_TOKEN)
    expect(submitting(h)).toEqual([CHECKPOINT_ITEM.id])
    h.answer.resolve({
      kind: 'accepted',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN,
    })
    await Promise.resolve()
    await Promise.resolve()
    const entry = h.session
      .getState()
      .chrome.checkpoints.find((e) => e.runId === NIGHTLY_AUDIT_RUN_ID)
    expect(entry?.entry.kind).toBe('answered')
  })

  it('rebuilds a new-token card from contract fields and drops the old meta line', async () => {
    const h = await harness()
    h.session.refreshCheckpoint(CHECKPOINT_ITEM.id)
    h.refresh.resolve({
      kind: 'checkpoint',
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
      pending: [
        {
          attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
          nodeId: CHECKPOINT_ITEM.nodeId,
          path: [...CHECKPOINT_ITEM.path],
          nodeTitle: 'Open pull request',
          reason: 'Caller guidance required',
          status: 'paused',
          workflowName: null,
        },
      ],
    })
    await Promise.resolve()
    await Promise.resolve()
    const card = h.session
      .getState()
      .displayItems.find((item) => item.id === CHECKPOINT_ITEM.id)
    expect(card).toMatchObject({
      attentionCheckpointId: NEEDS_YOU_CHECKPOINT_TOKEN_NEXT,
      exactAction: '',
      detail: 'Caller guidance required',
    })
  })

  it('seeding Needs you refusals keeps entries for other tasks', async () => {
    const h = await harness()
    h.registry.mergeSeedEntries([
      {
        kind: 'non_actionable',
        taskId: 'task-other',
        requestId: 'r-other',
        ownerRevision: 1,
      },
    ])
    h.session.seedApprovalChrome({
      refusals: [
        {
          taskId: NEEDS_YOU_APPROVAL_TASK_ID,
          requestId: TASK_ITEM.requestId,
          refusal: { reason: 'not_current' },
        },
      ],
    })
    const taskIds = h.registry.asChrome().entries.map((e) => e.taskId)
    expect(taskIds).toContain('task-other')
    expect(taskIds).toContain(NEEDS_YOU_APPROVAL_TASK_ID)
  })
})

describe('checkpoint already-answered winner', () => {
  it('draws the winner from its present fields', () => {
    const view = needsYouCheckpointCardView(CHECKPOINT_ITEM, {
      kind: 'refused',
      code: 'interaction_already_answered',
      interaction: {
        answeredBy: 'monitor',
        answer: 'approve',
        answeredAt: 1792000005,
      },
    })
    expect(view.mode).toMatchObject({ kind: 'result', refresh: false })
    const mode = view.mode
    expect(mode.kind === 'result' ? mode.title : null).toContain('approve')
  })

  it('keeps the neutral line when no winner is carried', () => {
    const view = needsYouCheckpointCardView(CHECKPOINT_ITEM, {
      kind: 'refused',
      code: 'interaction_already_answered',
    })
    expect(view.mode).toMatchObject({ kind: 'result', title: null })
  })
})
