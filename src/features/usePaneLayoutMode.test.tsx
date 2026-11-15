import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaneLayoutMode } from './usePaneLayoutMode'

let width = 0
let callbacks: (() => void)[] = []
let disconnects = 0

class StubResizeObserver {
  private readonly callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
    callbacks.push(callback)
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    disconnects += 1
    callbacks = callbacks.filter((entry) => entry !== this.callback)
  }
}

function makeMain(): HTMLElement {
  const el = document.createElement('main')
  Object.defineProperty(el, 'clientWidth', { get: () => width })
  return el
}

function resizeTo(next: number): void {
  width = next
  act(() => {
    for (const callback of [...callbacks]) callback()
  })
}

beforeEach(() => {
  width = 0
  callbacks = []
  disconnects = 0
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePaneLayoutMode', () => {
  it('is split before an element exists', () => {
    const { result } = renderHook(() => usePaneLayoutMode(null))
    expect(result.current).toBe('split')
  })

  it('is split at a 1280 frame minus the 264 sidebar (1016)', () => {
    width = 1016
    const { result } = renderHook(() => usePaneLayoutMode(makeMain()))
    expect(result.current).toBe('split')
  })

  it('is overlay at a 1000 frame minus the 264 sidebar (736)', () => {
    width = 736
    const main = makeMain()
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('overlay')
  })

  it('is split at a 1000 frame minus the 56 rail (944)', () => {
    width = 944
    const main = makeMain()
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('split')
  })

  it('treats exactly 900 as split and 899 as overlay', () => {
    const main = makeMain()
    width = 900
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('split')
    resizeTo(899)
    expect(result.current).toBe('overlay')
  })

  it('flips with the resize observer callback in both directions', () => {
    width = 1016
    const main = makeMain()
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('split')
    resizeTo(736)
    expect(result.current).toBe('overlay')
    resizeTo(1016)
    expect(result.current).toBe('split')
  })

  it('keeps the current mode when the width is non-positive', () => {
    width = 736
    const main = makeMain()
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('overlay')
    resizeTo(0)
    expect(result.current).toBe('overlay')
    resizeTo(-5)
    expect(result.current).toBe('overlay')
  })

  it('stays split when the first measurement is zero', () => {
    width = 0
    const { result } = renderHook(() => usePaneLayoutMode(makeMain()))
    expect(result.current).toBe('split')
  })

  it('disconnects the observer on unmount', () => {
    width = 1016
    const { unmount } = renderHook(() => usePaneLayoutMode(makeMain()))
    expect(callbacks).toHaveLength(1)
    unmount()
    expect(disconnects).toBe(1)
    expect(callbacks).toHaveLength(0)
  })

  it('still measures once when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    width = 736
    const main = makeMain()
    const { result } = renderHook(() => usePaneLayoutMode(main))
    expect(result.current).toBe('overlay')
  })
})
