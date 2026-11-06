import { describe, expect, it } from 'vitest'
import { createLoadNeedsYouUseCase } from '../application'
import type { EnginePort } from '../application'
import type { NeedsYouLoad } from '../model'
import { asObservationId } from '../model'
import { NeedsYouSession } from './needsYouSession'

function port(loads: NeedsYouLoad[]): {
  engine: EnginePort
  saved: Array<(load: NeedsYouLoad) => void>
} {
  const saved: Array<(load: NeedsYouLoad) => void> = []
  const engine = {
    observeNeedsYou(onUpdate: (load: NeedsYouLoad) => void) {
      saved.push(onUpdate)
      const load = loads.shift()
      if (load) queueMicrotask(() => onUpdate(load))
      return { id: asObservationId('needs'), cancel() {} }
    },
  } as EnginePort
  return { engine, saved }
}

describe('NeedsYouSession', () => {
  it('replaces a waiting observation with an empty one and ignores the stale callback', async () => {
    const { engine, saved } = port([
      {
        kind: 'ready',
        observation: {
          coverage: 'complete',
          coverageNote: null,
          items: [
            {
              kind: 'question',
              id: 'q1',
              prompt: 'First?',
              detail: 'detail',
              context: {
                kind: 'task',
                title: 'One',
                waitingLabel: 'waiting 1m',
                taskId: null,
              },
            },
          ],
        },
      },
      {
        kind: 'ready',
        observation: { coverage: 'complete', coverageNote: null, items: [] },
      },
    ])
    const session = new NeedsYouSession(createLoadNeedsYouUseCase(engine))
    session.start()
    await Promise.resolve()
    expect(session.getState().load).toMatchObject({ kind: 'ready' })
    const stale = saved[0]
    session.start()
    expect(session.getState().load.kind).toBe('loading')
    stale?.({
      kind: 'ready',
      observation: {
        coverage: 'complete',
        coverageNote: null,
        items: [
          {
            kind: 'question',
            id: 'stale',
            prompt: 'Stale?',
            detail: 'stale',
            context: {
              kind: 'task',
              title: 'Stale',
              waitingLabel: 'waiting 9m',
              taskId: null,
            },
          },
        ],
      },
    })
    expect(session.getState().load.kind).toBe('loading')
    await Promise.resolve()
    expect(session.getState().load).toEqual({
      kind: 'ready',
      observation: { coverage: 'complete', coverageNote: null, items: [] },
    })
  })

  it('ignores a captured callback after disposal', async () => {
    const { engine, saved } = port([
      { kind: 'ready', observation: { coverage: 'complete', coverageNote: null, items: [] } },
    ])
    const session = new NeedsYouSession(createLoadNeedsYouUseCase(engine))
    session.start()
    await Promise.resolve()
    const stale = saved[0]
    session.dispose()
    stale?.({ kind: 'unavailable', message: 'late' })
    expect(session.getState().load).toEqual({
      kind: 'ready',
      observation: { coverage: 'complete', coverageNote: null, items: [] },
    })
  })

  it('clears a ready claim when the next publication is loading', async () => {
    const { engine, saved } = port([
      { kind: 'ready', observation: { coverage: 'complete', coverageNote: null, items: [] } },
    ])
    const session = new NeedsYouSession(createLoadNeedsYouUseCase(engine))
    session.start()
    await Promise.resolve()
    expect(session.getState().load.kind).toBe('ready')
    saved[0]?.({ kind: 'loading' })
    expect(session.getState().load.kind).toBe('loading')
  })
})
