import { act, render } from '@testing-library/react'
import { vi } from 'vitest'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import { applyNewTaskSeed, createApp } from '../composition'
import { AppFeature } from '../features/AppFeature'

/** Width stubbed for `main.hd-main` (jsdom has no layout). */
let mainWidth = 0
let observers: ((entries: unknown[]) => void)[] = []

export function installLayoutStubs(): void {
  mainWidth = 0
  observers = []
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains('hd-main') ? mainWidth : 0
    },
  )
  class StubResizeObserver {
    private readonly callback: () => void
    constructor(callback: () => void) {
      this.callback = callback
      observers.push(callback)
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {
      observers = observers.filter((entry) => entry !== this.callback)
    }
  }
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
}

export function removeLayoutStubs(): void {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
}

export function setDetailWidth(width: number): void {
  mainWidth = width
}

/** Fires every live ResizeObserver callback after a new stubbed width. */
export async function fireResize(width: number): Promise<void> {
  mainWidth = width
  await act(async () => {
    for (const callback of [...observers]) callback([])
  })
}

export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Mounts a scenario the way the app tests do: seed applied after first load. */
export async function mountScenario(scenario: ScenarioId, width: number) {
  setDetailWidth(width)
  const app = createApp(scenario)
  const view = render(<AppFeature presenter={app.presenter} />)
  await flush()
  await act(async () => {
    applyNewTaskSeed(app.presenter, scenarioById(scenario).seed)
    await Promise.resolve()
    await Promise.resolve()
  })
  await flush()
  return { app, view }
}

export function main(): HTMLElement {
  const el = document.querySelector<HTMLElement>('main.hd-main')
  if (!el) throw new Error('main.hd-main not found')
  return el
}

export function body(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.hd-m05-body')
}

export function pane(): HTMLElement | null {
  return document.getElementById('task-details-pane')
}
