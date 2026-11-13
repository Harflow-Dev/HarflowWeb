import { describe, expect, it } from 'vitest'
import {
  createLoadParallelGroupUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asParallelGroupId,
  PARALLEL_GROUP_UNAVAILABLE,
  type ParallelGroupId,
  type ParallelGroupLoad,
} from '../model'
import {
  parallelGroupLoadFor,
  PRELOAD_PARALLEL_GROUP_ID,
  preloadParallelGroup,
  settledParallelGroup,
  TITLED_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { ParallelGroupSession } from './parallelGroupSession'

function port(options?: { readonly auto?: boolean }): {
  engine: EnginePort
  saved: Array<{ id: ParallelGroupId; send: (load: ParallelGroupLoad) => void }>
} {
  const saved: Array<{
    id: ParallelGroupId
    send: (load: ParallelGroupLoad) => void
  }> = []
  const engine = {
    observeParallelGroup(
      id: ParallelGroupId,
      onUpdate: (load: ParallelGroupLoad) => void,
    ) {
      saved.push({ id, send: onUpdate })
      if (options?.auto !== false) {
        queueMicrotask(() => onUpdate(parallelGroupLoadFor(id)))
      }
      return {
        id: asObservationId(`group-${id}`),
        cancel() {
          const index = saved.findIndex(
            (entry) => entry.id === id && entry.send === onUpdate,
          )
          if (index >= 0) saved.splice(index, 1)
        },
      }
    },
  } as unknown as EnginePort
  return { engine, saved }
}

function sessionFor(engine: EnginePort): ParallelGroupSession {
  return new ParallelGroupSession(createLoadParallelGroupUseCase(engine))
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

const unavailable: ParallelGroupLoad = {
  kind: 'unavailable',
  message: PARALLEL_GROUP_UNAVAILABLE,
}

describe('ParallelGroupSession', () => {
  it('publishes unavailable when the first ready payload identity mismatches', () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    expect(session.getState().load.kind).toBe('loading')
    saved[0]?.send({
      kind: 'ready',
      group: {
        ...preloadParallelGroup(),
        groupId: asParallelGroupId('other'),
        title: 'Borrowed',
      },
    })
    expect(session.getState().load).toEqual(unavailable)
    expect(session.getState().groupId).toBe(PRELOAD_PARALLEL_GROUP_ID)
    session.dispose()
  })

  it('replaces ready lanes with unavailable after a mismatched update', () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    const send = saved[0]?.send
    send?.(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))
    expect(session.getState().load.kind).toBe('ready')
    send?.({
      kind: 'ready',
      group: {
        ...preloadParallelGroup(),
        groupId: asParallelGroupId('other'),
        title: 'Borrowed',
      },
    })
    expect(session.getState().load).toEqual(unavailable)
    session.dispose()
  })

  it('ignores an obsolete-generation callback after reopen', () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    const first = saved[0]?.send
    first?.(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))

    session.open(PRELOAD_PARALLEL_GROUP_ID)
    expect(session.getState().load.kind).toBe('loading')
    first?.({
      kind: 'ready',
      group: { ...preloadParallelGroup(), title: 'Stale generation' },
    })
    expect(session.getState().load.kind).toBe('loading')
    saved[saved.length - 1]?.send(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind === 'ready') {
      expect(load.group.title).toBe('Review preload bridge')
    }
    session.dispose()
  })

  it('shows unavailable for an unmapped group id', async () => {
    const { engine } = port()
    const session = sessionFor(engine)
    const missing = asParallelGroupId('parallel-group-missing')
    session.open(missing)
    await flush()
    expect(session.getState().load).toEqual(unavailable)
    session.dispose()
  })

  it('ignores a late callback after leave and resets on reopen', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    const first = saved[0]?.send
    first?.(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))
    expect(session.getState().groupId).toBe(PRELOAD_PARALLEL_GROUP_ID)

    session.close()
    expect(session.getState().groupId).toBeNull()
    expect(session.getState().load.kind).toBe('loading')
    first?.({
      kind: 'ready',
      group: { ...preloadParallelGroup(), title: 'Late replacement' },
    })
    expect(session.getState().groupId).toBeNull()
    expect(session.getState().load.kind).toBe('loading')

    session.open(PRELOAD_PARALLEL_GROUP_ID)
    expect(session.getState().load.kind).toBe('loading')
    saved[saved.length - 1]?.send(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind === 'ready') {
      expect(load.group.title).toBe('Review preload bridge')
    }
    session.dispose()
  })
})

describe('ParallelGroupSession chrome reset', () => {
  async function openedWithChrome(): Promise<{
    session: ParallelGroupSession
    port: ReturnType<typeof port>
  }> {
    const p = port()
    const session = sessionFor(p.engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    await flush()
    session.applyChrome({
      showPrompt: true,
      openMenuLaneId: 'lane-claude-code',
    })
    session.setCancelAllConfirm(true)
    return { session, port: p }
  }

  it('applyChrome and the setters drive prompt, menu, and dialog state', async () => {
    const { session } = await openedWithChrome()
    const state = session.getState()
    expect(state.showPrompt).toBe(true)
    expect(state.cancelAllConfirm).toBe(true)
    // Opening the dialog closes the lane menu.
    expect(state.openMenuLaneId).toBeNull()
  })

  it('close resets prompt, menu, and dialog, and a reopen starts clean', async () => {
    const { session } = await openedWithChrome()
    session.close()
    expect(session.getState()).toMatchObject({
      groupId: null,
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
    })
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    await flush()
    expect(session.getState()).toMatchObject({
      groupId: PRELOAD_PARALLEL_GROUP_ID,
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
    })
    expect(session.getState().load.kind).toBe('ready')
  })

  it('opening another group without closing also resets', async () => {
    const { session } = await openedWithChrome()
    session.open(asParallelGroupId('parallel-group-two-lanes'))
    expect(session.getState()).toMatchObject({
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
      load: { kind: 'loading', memberCount: null },
    })
  })
})

describe('ParallelGroupSession cancel-all dialog', () => {
  it('clears the dialog when a ready update leaves no running lane', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(TITLED_PARALLEL_GROUP_ID)
    saved[0]?.send(parallelGroupLoadFor(TITLED_PARALLEL_GROUP_ID))
    session.setCancelAllConfirm(true)
    saved[0]?.send({
      kind: 'ready',
      group: {
        ...settledParallelGroup(),
        groupId: TITLED_PARALLEL_GROUP_ID,
      },
    })
    expect(session.getState().cancelAllConfirm).toBe(false)
    saved[0]?.send(parallelGroupLoadFor(TITLED_PARALLEL_GROUP_ID))
    expect(session.getState().cancelAllConfirm).toBe(false)
  })

  it('keeps the dialog across a running update', () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(TITLED_PARALLEL_GROUP_ID)
    saved[0]?.send(parallelGroupLoadFor(TITLED_PARALLEL_GROUP_ID))
    session.setCancelAllConfirm(true)
    saved[0]?.send(parallelGroupLoadFor(TITLED_PARALLEL_GROUP_ID))
    expect(session.getState().cancelAllConfirm).toBe(true)
  })
})
