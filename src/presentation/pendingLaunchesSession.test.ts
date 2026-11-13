import { describe, expect, it } from 'vitest'
import {
  createLoadPendingLaunchCapabilityUseCase,
  createLoadPendingLaunchInventoryUseCase,
  createLoadPendingLaunchStatusUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  type PendingLaunchId,
  type PendingLaunchStatusLoad,
} from '../model'
import {
  PENDING_LAUNCH_A,
  PENDING_LAUNCH_B,
  pendingCapabilitySupported,
  pendingInventoryReady,
  pendingStatusGranted,
  pendingStatusWaiting,
} from '../adapters/mock/pendingLaunchFixtures'
import { PendingLaunchesSession } from './pendingLaunchesSession'

type StatusCall = {
  readonly id: PendingLaunchId
  readonly send: (load: PendingLaunchStatusLoad) => void
  cancelled: boolean
}

/**
 * Deferred port: status reads resolve only when the test sends them, and a
 * cancelled read can still call back, as a late engine callback would.
 */
function deferredPort(): { engine: EnginePort; calls: StatusCall[] } {
  const calls: StatusCall[] = []
  const engine = {
    observePendingLaunchCapability(onUpdate: (load: unknown) => void) {
      onUpdate(pendingCapabilitySupported())
      return { id: asObservationId('cap'), cancel() {} }
    },
    observePendingLaunchInventory(onUpdate: (load: unknown) => void) {
      onUpdate(pendingInventoryReady())
      return { id: asObservationId('inv'), cancel() {} }
    },
    observePendingLaunchStatus(
      id: PendingLaunchId,
      onUpdate: (load: PendingLaunchStatusLoad) => void,
    ) {
      const call: StatusCall = { id, send: onUpdate, cancelled: false }
      calls.push(call)
      return {
        id: asObservationId(`status-${calls.length}`),
        cancel() {
          call.cancelled = true
        },
      }
    },
  } as unknown as EnginePort
  return { engine, calls }
}

function sessionFor(engine: EnginePort): PendingLaunchesSession {
  const session = new PendingLaunchesSession(
    createLoadPendingLaunchCapabilityUseCase(engine),
    createLoadPendingLaunchInventoryUseCase(engine),
    createLoadPendingLaunchStatusUseCase(engine),
  )
  session.start()
  return session
}

function readyFor(id: PendingLaunchId): PendingLaunchStatusLoad {
  return {
    kind: 'ready',
    status: id === PENDING_LAUNCH_A ? pendingStatusWaiting() : {
      ...pendingStatusGranted(),
      launchId: id,
    },
  }
}

describe('PendingLaunchesSession', () => {
  it('ignores a late status callback for a launch that is no longer selected', () => {
    const { engine, calls } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_A)
    session.openLaunch(PENDING_LAUNCH_B)
    const [first, second] = calls
    expect(first?.cancelled).toBe(true)
    second?.send(readyFor(PENDING_LAUNCH_B))
    first?.send(readyFor(PENDING_LAUNCH_A))
    const state = session.getState()
    expect(state.selectedLaunchId).toBe(PENDING_LAUNCH_B)
    expect(state.status).toEqual(readyFor(PENDING_LAUNCH_B))
  })

  it('ignores a status callback that arrives after close', () => {
    const { engine, calls } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_A)
    session.close()
    calls[0]?.send(readyFor(PENDING_LAUNCH_A))
    const state = session.getState()
    expect(state.selectedLaunchId).toBeNull()
    expect(state.status).toEqual({ kind: 'loading' })
  })

  it('rejects a ready status whose launch ID is not the selected ID', () => {
    const { engine, calls } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_B)
    calls[0]?.send(readyFor(PENDING_LAUNCH_A))
    expect(session.getState().status).toEqual({ kind: 'unavailable' })
    calls[0]?.send(readyFor(PENDING_LAUNCH_B))
    expect(session.getState().status).toEqual(readyFor(PENDING_LAUNCH_B))
  })

  it('clears Stop confirm when reopening the inventory', () => {
    const { engine, calls } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_A)
    calls[0]?.send(readyFor(PENDING_LAUNCH_A))
    session.setStopConfirm(true)
    expect(session.getState().stopConfirm).toBe(true)
    session.openInventory()
    expect(session.getState().stopConfirm).toBe(false)
    expect(session.getState().selectedLaunchId).toBeNull()
  })

  it('clears Stop confirm when a republished status no longer offers Stop', () => {
    const { engine, calls } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_A)
    calls[0]?.send(readyFor(PENDING_LAUNCH_A))
    session.setStopConfirm(true)
    calls[0]?.send({
      kind: 'ready',
      status: { ...pendingStatusWaiting(), stopSupport: 'none' },
    })
    expect(session.getState().stopConfirm).toBe(false)
    session.setStopConfirm(true)
    expect(session.getState().stopConfirm).toBe(false)
  })

  it('does not open Stop confirm while the status is still loading', () => {
    const { engine } = deferredPort()
    const session = sessionFor(engine)
    session.openLaunch(PENDING_LAUNCH_A)
    session.setStopConfirm(true)
    expect(session.getState().stopConfirm).toBe(false)
  })
})
