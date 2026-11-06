import { describe, expect, it } from 'vitest'
import {
  createLoadWorkflowRunUseCase,
  createLoadWorkflowsUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asRepositoryId,
  asWorkflowId,
  type WorkflowId,
  type WorkflowRunContextLoad,
  type WorkflowRunDraft,
} from '../model'
import {
  NIGHTLY_WORKFLOW_ID,
  RELEASE_WORKFLOW_ID,
  workflowRunLoadFor,
} from '../adapters/mock/workflowRunFixtures'
import { WorkflowsSession } from './workflowsSession'

function port(options?: { readonly auto?: boolean }): {
  engine: EnginePort
  saved: Array<{
    id: WorkflowId
    send: (load: WorkflowRunContextLoad) => void
  }>
} {
  const saved: Array<{
    id: WorkflowId
    send: (load: WorkflowRunContextLoad) => void
  }> = []
  const engine = {
    observeWorkflows() {
      return { id: asObservationId('wf'), cancel() {} }
    },
    observeWorkflowRun(id: WorkflowId, onUpdate: (load: WorkflowRunContextLoad) => void) {
      saved.push({ id, send: onUpdate })
      if (options?.auto !== false) {
        const load = workflowRunLoadFor(id)
        queueMicrotask(() => onUpdate(load))
      }
      return { id: asObservationId(`run-${id}`), cancel() {} }
    },
  } as unknown as EnginePort
  return { engine, saved }
}

function draftOf(
  session: WorkflowsSession,
  id: WorkflowId,
): WorkflowRunDraft {
  const draft = session.getState().drafts[id]
  if (!draft) throw new Error(`missing draft ${id}`)
  return draft
}

describe('WorkflowsSession run drafts', () => {
  it('keeps each definition draft and ignores a stale context callback', async () => {
    const { engine, saved } = port()
    const session = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    session.start()
    session.openRun(RELEASE_WORKFLOW_ID)
    await Promise.resolve()
    session.setTask('  alpha  ')
    session.selectOverride('custom')
    expect(session.getState().drafts[RELEASE_WORKFLOW_ID]?.overrideId).toBe('saved')
    const stale = saved[0]
    const release = workflowRunLoadFor(RELEASE_WORKFLOW_ID)
    session.openRun(NIGHTLY_WORKFLOW_ID)
    expect(session.getState().runContext.kind).toBe('loading')
    expect(session.getState().drafts[RELEASE_WORKFLOW_ID]?.task).toBe('  alpha  ')
    stale?.send(release)
    expect(session.getState().runWorkflowId).toBe(NIGHTLY_WORKFLOW_ID)
    expect(session.getState().runContext.kind).toBe('loading')
    await Promise.resolve()
    const nightly = session.getState().runContext
    expect(nightly.kind).toBe('ready')
    if (nightly.kind === 'ready') {
      expect(nightly.context.workflowId).toBe(NIGHTLY_WORKFLOW_ID)
      expect(nightly.context.title).toBe('Nightly dependency audit')
    }
    expect(session.getState().drafts[NIGHTLY_WORKFLOW_ID]?.task).not.toBe('  alpha  ')
    expect(session.getState().drafts[RELEASE_WORKFLOW_ID]?.task).toBe('  alpha  ')
  })

  it('ignores a captured callback after disposal and rejects an unmapped id', async () => {
    const { engine, saved } = port()
    const session = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    session.openRun(RELEASE_WORKFLOW_ID)
    await Promise.resolve()
    const stale = saved[0]
    session.dispose()
    stale?.send({ kind: 'unavailable', message: 'late' })
    expect(session.getState().runContext.kind).toBe('ready')

    const next = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    next.openRun(asWorkflowId('wf-missing'))
    await Promise.resolve()
    expect(next.getState().runContext).toEqual({
      kind: 'unavailable',
      message: 'This workflow is unavailable.',
    })
    expect(next.getState().drafts[RELEASE_WORKFLOW_ID]).toBeUndefined()
  })

  it('rejects a different definition delivered on the current callback', async () => {
    const { engine, saved } = port()
    const session = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    session.openRun(RELEASE_WORKFLOW_ID)
    await Promise.resolve()
    session.setTask('  alpha  ')
    session.setGoal('keep goal')
    session.selectRepository(asRepositoryId('repo-mac'))
    session.openRun(NIGHTLY_WORKFLOW_ID)
    await Promise.resolve()
    session.setTask('beta')
    session.setGoal('nightly goal')
    const releaseDraft = { ...draftOf(session, RELEASE_WORKFLOW_ID) }
    const nightlyDraft = { ...draftOf(session, NIGHTLY_WORKFLOW_ID) }
    const nightlyContext = session.getState().runContext
    saved[1]?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(releaseDraft)
    expect(draftOf(session, NIGHTLY_WORKFLOW_ID)).toEqual(nightlyDraft)
    expect(session.getState().runContext).toEqual(nightlyContext)
    expect(session.getState().runWorkflowId).toBe(NIGHTLY_WORKFLOW_ID)
  })

  it('reobserves a ready run after restart and rejects the old callback', async () => {
    const { engine, saved } = port({ auto: false })
    const session = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    session.openRun(RELEASE_WORKFLOW_ID)
    saved[0]?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    session.setTask('  alpha  ')
    session.setGoal('keep goal')
    const draft = { ...draftOf(session, RELEASE_WORKFLOW_ID) }
    const stale = saved[0]
    expect(session.getState().runContext.kind).toBe('ready')
    session.dispose()
    stale?.send(workflowRunLoadFor(NIGHTLY_WORKFLOW_ID))
    expect(session.getState().runContext.kind).toBe('ready')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    session.start()
    expect(session.getState().runContext.kind).toBe('loading')
    expect(session.getState().runWorkflowId).toBe(RELEASE_WORKFLOW_ID)
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    stale?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(session.getState().runContext.kind).toBe('loading')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    saved[1]?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    const ready = session.getState().runContext
    expect(ready.kind).toBe('ready')
    if (ready.kind === 'ready') {
      expect(ready.context.workflowId).toBe(RELEASE_WORKFLOW_ID)
    }
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
  })

  it('reobserves a pending run after restart and rejects the old callback', () => {
    const { engine, saved } = port({ auto: false })
    const session = new WorkflowsSession(
      createLoadWorkflowsUseCase(engine),
      createLoadWorkflowRunUseCase(engine),
    )
    session.openRun(RELEASE_WORKFLOW_ID)
    session.setTask('  alpha  ')
    session.setGoal('keep goal')
    const draft = { ...draftOf(session, RELEASE_WORKFLOW_ID) }
    expect(session.getState().runContext.kind).toBe('loading')
    const stale = saved[0]
    session.dispose()
    session.start()
    expect(session.getState().runContext.kind).toBe('loading')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    stale?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(session.getState().runContext.kind).toBe('loading')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    saved[1]?.send(workflowRunLoadFor(NIGHTLY_WORKFLOW_ID))
    expect(session.getState().runContext.kind).toBe('loading')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual(draft)
    saved[1]?.send(workflowRunLoadFor(RELEASE_WORKFLOW_ID))
    expect(session.getState().runContext.kind).toBe('ready')
    expect(draftOf(session, RELEASE_WORKFLOW_ID)).toEqual({ ...draft, seeded: true })
  })
})
