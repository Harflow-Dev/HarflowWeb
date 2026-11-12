import { describe, expect, it, vi } from 'vitest'
import type { NewTaskScenarioSeed } from '../adapters/mock'
import type { AppPresenter, AppScreenState } from '../presentation'
import { applyNewTaskSeed } from './applyNewTaskSeed'

type Kind = 'loading' | 'unavailable' | 'ready'

type Fake = {
  readonly presenter: AppPresenter
  readonly selectWorkflowNode: ReturnType<typeof vi.fn>
  readonly setTaskChangesPaneOpen: ReturnType<typeof vi.fn>
  readonly listenerCount: () => number
  readonly set: (patch: { editorId?: string | null; editor?: Kind; taskId?: string | null; task?: Kind }) => void
}

/** Minimal presenter. Like AppSession, subscribe replays the state synchronously. */
function fakePresenter(initial: { editor: Kind; task: Kind }): Fake {
  let editorId: string | null = null
  let editor: Kind = initial.editor
  let taskId: string | null = null
  let task: Kind = initial.task
  const listeners = new Set<(state: AppScreenState) => void>()
  const state = (): AppScreenState =>
    ({
      workflowEditor: { workflowId: editorId, load: { kind: editor } },
      task: { selectedTaskId: taskId, load: { kind: task } },
    }) as unknown as AppScreenState
  const emit = () => {
    for (const listener of [...listeners]) listener(state())
  }
  const selectWorkflowNode = vi.fn()
  const setTaskChangesPaneOpen = vi.fn()
  const presenter = {
    getState: state,
    subscribe: (listener: (s: AppScreenState) => void) => {
      listeners.add(listener)
      listener(state())
      return () => {
        listeners.delete(listener)
      }
    },
    openWorkflowEditor: (id: string) => {
      editorId = id
      emit()
    },
    openTask: (id: string) => {
      taskId = id
      emit()
    },
    selectWorkflowNode,
    setTaskChangesPaneOpen,
  } as unknown as AppPresenter
  return {
    presenter,
    selectWorkflowNode,
    setTaskChangesPaneOpen,
    listenerCount: () => listeners.size,
    set: (patch) => {
      if (patch.editorId !== undefined) editorId = patch.editorId
      if (patch.editor !== undefined) editor = patch.editor
      if (patch.taskId !== undefined) taskId = patch.taskId
      if (patch.task !== undefined) task = patch.task
      emit()
    },
  }
}

const editorSeed: NewTaskScenarioSeed = {
  openWorkflowEditorId: 'wf-a',
  openWorkflowEditorNodeId: 'node-1',
}

const eventsSeed: NewTaskScenarioSeed = {
  openTaskId: 'task-a',
  eventsPaneOpen: true,
}

describe('applyNewTaskSeed node selection', () => {
  it('selects the node after the editor finishes loading', () => {
    const fake = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(fake.presenter, editorSeed)
    expect(fake.selectWorkflowNode).not.toHaveBeenCalled()
    fake.set({ editor: 'ready' })
    expect(fake.selectWorkflowNode).toHaveBeenCalledTimes(1)
    expect(fake.listenerCount()).toBe(0)
  })

  it('does not throw when the editor is already ready', () => {
    const fake = fakePresenter({ editor: 'ready', task: 'loading' })
    expect(() => applyNewTaskSeed(fake.presenter, editorSeed)).not.toThrow()
    expect(fake.selectWorkflowNode).toHaveBeenCalledTimes(1)
    expect(fake.listenerCount()).toBe(0)
  })

  it('stops listening without selecting when the load is unavailable', () => {
    const fake = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(fake.presenter, editorSeed)
    fake.set({ editor: 'unavailable' })
    expect(fake.selectWorkflowNode).not.toHaveBeenCalled()
    expect(fake.listenerCount()).toBe(0)
    fake.set({ editor: 'ready' })
    expect(fake.selectWorkflowNode).not.toHaveBeenCalled()
  })

  it('does not select in another editor opened before the load settled', () => {
    const fake = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(fake.presenter, editorSeed)
    fake.set({ editorId: 'wf-b', editor: 'loading' })
    expect(fake.listenerCount()).toBe(0)
    fake.set({ editor: 'ready' })
    expect(fake.selectWorkflowNode).not.toHaveBeenCalled()
  })
})

describe('applyNewTaskSeed Events pane', () => {
  it('opens Events once the task is ready, even if already ready', () => {
    const waiting = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(waiting.presenter, eventsSeed)
    expect(waiting.setTaskChangesPaneOpen).not.toHaveBeenCalled()
    waiting.set({ task: 'ready' })
    expect(waiting.setTaskChangesPaneOpen).toHaveBeenCalledWith(true)
    expect(waiting.listenerCount()).toBe(0)

    const ready = fakePresenter({ editor: 'loading', task: 'ready' })
    expect(() => applyNewTaskSeed(ready.presenter, eventsSeed)).not.toThrow()
    expect(ready.setTaskChangesPaneOpen).toHaveBeenCalledWith(true)
  })

  it('stops on unavailable or when another task is opened', () => {
    const unavailable = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(unavailable.presenter, eventsSeed)
    unavailable.set({ task: 'unavailable' })
    expect(unavailable.listenerCount()).toBe(0)
    expect(unavailable.setTaskChangesPaneOpen).not.toHaveBeenCalled()

    const switched = fakePresenter({ editor: 'loading', task: 'loading' })
    applyNewTaskSeed(switched.presenter, eventsSeed)
    switched.set({ taskId: 'task-b', task: 'loading' })
    expect(switched.listenerCount()).toBe(0)
    switched.set({ task: 'ready' })
    expect(switched.setTaskChangesPaneOpen).not.toHaveBeenCalled()
  })
})
