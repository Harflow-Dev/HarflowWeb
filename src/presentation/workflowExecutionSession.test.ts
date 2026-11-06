import { describe, expect, it } from 'vitest'
import {
  createLoadWorkflowExecutionUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asWorkflowNodeId,
  asWorkflowRunId,
  type WorkflowRunId,
  type WorkflowRunLoad,
} from '../model'
import {
  NIGHTLY_AUDIT_RUN_ID,
  SECURITY_REVIEWER_NODE_ID,
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
    expect(session.getState().selectedNodeId).toBeNull()
  })

  it('keeps a same-run choice and clears it when the run opens again', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    const missing = asWorkflowNodeId('run-missing-node')
    session.open(NIGHTLY_AUDIT_RUN_ID)
    expect(session.getState().selectedNodeId).toBeNull()
    session.selectNode(SECURITY_REVIEWER_NODE_ID)
    expect(session.getState().selectedNodeId).toBeNull()
    const callback = saved[0]?.send
    callback?.(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))
    const ready = session.getState().load
    session.selectNode(SECURITY_REVIEWER_NODE_ID)
    expect(session.getState().load).toBe(ready)
    expect(session.getState().selectedNodeId).toBe(SECURITY_REVIEWER_NODE_ID)
    if (ready.kind === 'ready') {
      expect(ready.run.selectedNodeId).not.toBe(SECURITY_REVIEWER_NODE_ID)
    }
    callback?.({
      kind: 'ready',
      run: { ...nightlyAuditRun(), progressLabel: 'Step 2 of 4 · 07:05' },
    })
    const updated = session.getState().load
    expect(session.getState().selectedNodeId).toBe(SECURITY_REVIEWER_NODE_ID)
    expect(updated.kind).toBe('ready')
    if (updated.kind === 'ready') {
      expect(updated.run.progressLabel).toBe('Step 2 of 4 · 07:05')
      expect(updated.run.selectedNodeId).toBe(nightlyAuditRun().selectedNodeId)
      expect(updated.run.runId).toBe(NIGHTLY_AUDIT_RUN_ID)
    }
    session.selectNode(missing)
    expect(session.getState().selectedNodeId).toBe(missing)
    const held = session.getState().load
    expect(held.kind).toBe('ready')
    if (held.kind === 'ready') {
      expect(held.run.onDemand[0]?.nodeId).toBe(SECURITY_REVIEWER_NODE_ID)
      expect(held.run.selectedNodeId).not.toBe(missing)
    }
    session.close()
    callback?.({ kind: 'ready', run: nightlyAuditRun() })
    expect(session.getState().runId).toBeNull()
    expect(session.getState().selectedNodeId).toBeNull()
    session.open(NIGHTLY_AUDIT_RUN_ID)
    saved[1]?.send(workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID))
    expect(session.getState().selectedNodeId).toBeNull()
    expect(session.getState().load.kind).toBe('ready')
  })
})
