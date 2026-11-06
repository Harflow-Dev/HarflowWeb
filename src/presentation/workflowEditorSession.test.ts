import { describe, expect, it } from 'vitest'
import {
  createLoadWorkflowEditorUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asWorkflowId,
  asWorkflowNodeId,
  findWorkflowEditorNode,
  type WorkflowEditorLoad,
  type WorkflowId,
} from '../model'
import {
  EDITOR_NIGHTLY_ID,
  EDITOR_RELEASE_ID,
  workflowEditorLoadFor,
} from '../adapters/mock/workflowEditorFixtures'
import { WorkflowEditorSession } from './workflowEditorSession'

function port(options?: { readonly auto?: boolean }): {
  engine: EnginePort
  saved: Array<{ id: WorkflowId; send: (load: WorkflowEditorLoad) => void }>
} {
  const saved: Array<{ id: WorkflowId; send: (load: WorkflowEditorLoad) => void }> = []
  const engine = {
    observeWorkflowEditor(id: WorkflowId, onUpdate: (load: WorkflowEditorLoad) => void) {
      saved.push({ id, send: onUpdate })
      if (options?.auto !== false) {
        const load = workflowEditorLoadFor(id)
        queueMicrotask(() => onUpdate(load))
      }
      return { id: asObservationId(`editor-${id}`), cancel() {} }
    },
  } as unknown as EnginePort
  return { engine, saved }
}

function sessionFor(engine: EnginePort): WorkflowEditorSession {
  return new WorkflowEditorSession(createLoadWorkflowEditorUseCase(engine))
}

describe('WorkflowEditorSession', () => {
  it('keeps each definition selection and ignores a foreign payload on the current callback', async () => {
    const { engine, saved } = port()
    const session = sessionFor(engine)
    session.open(EDITOR_RELEASE_ID)
    await Promise.resolve()
    session.select(asWorkflowNodeId('release-plan'))
    const releaseSelection = session.getState().selections[EDITOR_RELEASE_ID]
    const stale = saved[0]
    session.open(EDITOR_NIGHTLY_ID)
    expect(session.getState().load.kind).toBe('loading')
    stale?.send(workflowEditorLoadFor(EDITOR_RELEASE_ID))
    expect(session.getState().load.kind).toBe('loading')
    expect(session.getState().selections[EDITOR_RELEASE_ID]).toBe(releaseSelection)
    await Promise.resolve()
    const nightly = session.getState().load
    expect(nightly.kind).toBe('ready')
    if (nightly.kind === 'ready') {
      expect(nightly.definition.workflowId).toBe(EDITOR_NIGHTLY_ID)
      expect(nightly.definition.title).toBe('Nightly dependency audit')
    }
    expect(session.getState().selections[EDITOR_NIGHTLY_ID]).toBe(
      asWorkflowNodeId('nightly-audit'),
    )
    expect(session.getState().selections[EDITOR_RELEASE_ID]).toBe(
      asWorkflowNodeId('release-plan'),
    )
    saved[1]?.send(workflowEditorLoadFor(EDITOR_RELEASE_ID))
    const shown = session.getState().load
    expect(shown.kind).toBe('ready')
    if (shown.kind === 'ready') {
      expect(shown.definition.title).toBe('Nightly dependency audit')
    }
  })

  it('rejects a disposed callback and an unmapped id', async () => {
    const { engine, saved } = port()
    const session = sessionFor(engine)
    session.open(EDITOR_RELEASE_ID)
    await Promise.resolve()
    const stale = saved[0]
    session.dispose()
    stale?.send({ kind: 'unavailable', message: 'late' })
    expect(session.getState().load.kind).toBe('ready')

    const next = sessionFor(engine)
    next.open(asWorkflowId('wf-docs-links'))
    await Promise.resolve()
    expect(next.getState().load).toEqual({
      kind: 'unavailable',
      message: 'This workflow is unavailable.',
    })
    next.select(asWorkflowNodeId('release-review'))
    expect(next.getState().selections[EDITOR_RELEASE_ID]).toBeUndefined()
  })

  it('keeps a removed node id and does not select a substitute', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    const review = asWorkflowNodeId('release-review')
    session.open(EDITOR_RELEASE_ID)
    const ready = workflowEditorLoadFor(EDITOR_RELEASE_ID)
    saved[0]?.send(ready)
    expect(session.getState().selections[EDITOR_RELEASE_ID]).toBe(review)
    if (ready.kind !== 'ready') throw new Error('release fixture')
    saved[0]?.send({
      kind: 'ready',
      definition: {
        ...ready.definition,
        defaultSelectedId: asWorkflowNodeId('release-plan'),
        nodes: ready.definition.nodes.filter((node) => node.id !== review),
        edges: ready.definition.edges.filter(
          (edge) => edge.from !== review && edge.to !== review,
        ),
      },
    })
    expect(session.getState().selections[EDITOR_RELEASE_ID]).toBe(review)
    const shown = session.getState().load
    if (shown.kind === 'ready') {
      expect(findWorkflowEditorNode(shown.definition, review)).toBeNull()
      expect(shown.definition.nodes.some((node) => node.title === 'Plan')).toBe(true)
    }
    session.select(asWorkflowNodeId('not-a-node'))
    expect(session.getState().selections[EDITOR_RELEASE_ID]).toBe(review)
  })

  it('keeps the selected orchestrator when a stale Release payload arrives', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(EDITOR_NIGHTLY_ID)
    saved[0]?.send(workflowEditorLoadFor(EDITOR_NIGHTLY_ID))
    const orchestrator = asWorkflowNodeId('nightly-orchestrator')
    session.select(orchestrator)
    saved[0]?.send(workflowEditorLoadFor(EDITOR_RELEASE_ID))
    expect(session.getState().selections[EDITOR_NIGHTLY_ID]).toBe(orchestrator)
    const shown = session.getState().load
    expect(shown.kind).toBe('ready')
    if (shown.kind !== 'ready') return
    expect(shown.definition.workflowId).toBe(EDITOR_NIGHTLY_ID)
    const node = findWorkflowEditorNode(shown.definition, orchestrator)
    expect(node?.locked).toBe(true)
    expect(node?.sections.map((section) => section.label)).toEqual([
      'AGENT',
      'INSTRUCTIONS',
      'LIMITS',
    ])
    const instructions = node?.sections.find((section) => section.id === 'instructions')?.fields[0]
    expect(instructions && 'value' in instructions ? instructions.value : '').toContain('lockfile')
    expect(
      shown.definition.edges.some((edge) => edge.from === orchestrator || edge.to === orchestrator),
    ).toBe(false)
  })
})
