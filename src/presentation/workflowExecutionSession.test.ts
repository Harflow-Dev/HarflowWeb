import { describe, expect, it } from 'vitest'
import {
  createLoadWorkflowExecutionUseCase,
  type EnginePort,
} from '../application'
import { asObservationId, asWorkflowRunId, type WorkflowRunId, type WorkflowRunLoad } from '../model'
import {
  NIGHTLY_AUDIT_RUN_ID,
  nightlyAuditRun,
  workflowExecutionLoadFor,
} from '../adapters/mock/workflowExecutionFixtures'
import { WorkflowExecutionSession } from './workflowExecutionSession'

function port(options?: { readonly auto?: boolean }): {
  engine: EnginePort
  saved: Array<{ id: WorkflowRunId; send: (load: WorkflowRunLoad) => void }>
} {
  const saved: Array<{ id: WorkflowRunId; send: (load: WorkflowRunLoad) => void }> = []
  const engine = {
    observeWorkflowExecution(id: WorkflowRunId, onUpdate: (load: WorkflowRunLoad) => void) {
      saved.push({ id, send: onUpdate })
      if (options?.auto !== false) {
        queueMicrotask(() => onUpdate(workflowExecutionLoadFor(id)))
      }
      return { id: asObservationId(`run-${id}`), cancel() {} }
    },
  } as unknown as EnginePort
  return { engine, saved }
}

function sessionFor(engine: EnginePort): WorkflowExecutionSession {
  return new WorkflowExecutionSession(createLoadWorkflowExecutionUseCase(engine))
}

describe('WorkflowExecutionSession', () => {
  it('shows only the requested run and ignores a mismatched payload', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    const missing = asWorkflowRunId('run-missing')
    session.open(missing)
    const callback = saved[0]?.send
    callback?.(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))
    await Promise.resolve()
    expect(session.getState().runId).toBe(missing)
    expect(session.getState().load.kind).toBe('loading')
    callback?.({ kind: 'unavailable', message: 'This workflow run is unavailable.' })
    expect(session.getState().load).toEqual({
      kind: 'unavailable',
      message: 'This workflow run is unavailable.',
    })
    session.open(NIGHTLY_AUDIT_RUN_ID)
    saved[1]?.send(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))
    const ready = session.getState().load
    expect(ready.kind).toBe('ready')
    if (ready.kind === 'ready') {
      expect(ready.run.runId).toBe(NIGHTLY_AUDIT_RUN_ID)
      expect(ready.run.definitionId).not.toBe(ready.run.runId)
      expect(ready.run.title).toBe('Nightly dependency audit')
    }
    saved[0]?.send(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))
    expect(session.getState().runId).toBe(NIGHTLY_AUDIT_RUN_ID)
  })

  it('rejects a stale callback after the run closes', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(NIGHTLY_AUDIT_RUN_ID)
    const callback = saved[0]?.send
    session.close()
    callback?.({ kind: 'ready', run: nightlyAuditRun() })
    expect(session.getState().runId).toBeNull()
    expect(session.getState().load.kind).toBe('loading')
  })
})
