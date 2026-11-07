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

describe('ParallelGroupSession', () => {
  it('loads the mapped group and refuses a mismatched payload', async () => {
    const { engine, saved } = port({ auto: false })
    const session = sessionFor(engine)
    session.open(PRELOAD_PARALLEL_GROUP_ID)
    expect(session.getState().load.kind).toBe('loading')
    const send = saved[0]?.send
    send?.({
      kind: 'ready',
      group: {
        ...preloadParallelGroup(),
        groupId: asParallelGroupId('other'),
        title: 'Borrowed',
      },
    })
    expect(session.getState().load.kind).toBe('loading')
    send?.(parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID))
    expect(session.getState().load).toEqual(
      parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID),
    )
    session.dispose()
  })

  it('shows unavailable for an unmapped group id', async () => {
    const { engine } = port()
    const session = sessionFor(engine)
    const missing = asParallelGroupId('parallel-group-missing')
    session.open(missing)
    await flush()
    expect(session.getState().load).toEqual({
      kind: 'unavailable',
      message: PARALLEL_GROUP_UNAVAILABLE,
    })
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
