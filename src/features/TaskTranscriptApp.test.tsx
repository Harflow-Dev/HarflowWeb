import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createLoadHarnessesUseCase,
  createLoadNeedsYouUseCase,
  createLoadParallelGroupUseCase,
  createLoadResourcesUseCase,
  createLoadStatisticsUseCase,
  createLoadTaskChangesUseCase,
  createLoadTaskUseCase,
  createLoadWorkflowEditorUseCase,
  createLoadWorkflowExecutionUseCase,
  createLoadWorkflowRunUseCase,
  createLoadWorkflowsUseCase,
  createStartTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  type ObservationHandle,
  type TaskId,
} from '../model'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import { populatedHarnessesLoad } from '../adapters/mock/harnessFixtures'
import { emptyNeedsYouLoad } from '../adapters/mock/needsYouFixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import {
  TRANSCRIPT_TASK_IDS,
  transcriptTaskLoad,
} from '../adapters/mock/transcriptFixtures'
import { taskChangesLoadFor } from '../adapters/mock/taskChangesFixtures'
import { POPULATED_WORKFLOWS } from '../adapters/mock/workflowFixtures'
import { createAppPresenter } from '../presentation'
import { AppFeature } from './AppFeature'

function transcriptEngine(): EnginePort {
  return {
    observeContext(onUpdate) {
      queueMicrotask(() =>
        onUpdate({
          kind: 'ready',
          composer: populatedComposer(),
          sidebar: populatedSidebar(),
        }),
      )
      return handle('ctx')
    },
    observeWorkflows(onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'ready', workflows: POPULATED_WORKFLOWS }),
      )
      return handle('wf')
    },
    observeWorkflowRun(_id, onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'unavailable', message: 'unused' }),
      )
      return handle('wfr')
    },
    observeWorkflowEditor(_id, onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'unavailable', message: 'unused' }),
      )
      return handle('wfe')
    },
    observeWorkflowExecution(_id, onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'unavailable', message: 'unused' }),
      )
      return handle('wfx')
    },
    observeParallelGroup(_id, onUpdate) {
      queueMicrotask(() =>
        onUpdate({ kind: 'unavailable', message: 'unused' }),
      )
      return handle('pg')
    },
    observeResources(onUpdate) {
      queueMicrotask(() => onUpdate(populatedResourcesLoad()))
      return handle('res')
    },
    observeStatistics(range, onUpdate) {
      queueMicrotask(() => onUpdate(statisticsLoadFor(range)))
      return handle('stats')
    },
    observeTask(taskId, onUpdate) {
      const mount = mountFor(taskId)
      queueMicrotask(() =>
        onUpdate(
          mount
            ? transcriptTaskLoad(mount)
            : { kind: 'unavailable', message: 'unmapped' },
        ),
      )
      return handle('task')
    },
    observeTaskChanges(query, onUpdate) {
      queueMicrotask(() => onUpdate(taskChangesLoadFor(query)))
      return handle('changes')
    },
    observeHarnesses(onUpdate) {
      queueMicrotask(() => onUpdate(populatedHarnessesLoad()))
      return handle('harnesses')
    },
    observeNeedsYou(onUpdate) {
      queueMicrotask(() => onUpdate(emptyNeedsYouLoad()))
      return handle('needs')
    },
    async startTask(_request) {
      return { kind: 'accepted', taskId: TRANSCRIPT_TASK_IDS.observed }
    },
  }
}

function mountFor(taskId: TaskId) {
  const entry = (
    Object.entries(TRANSCRIPT_TASK_IDS) as [
      keyof typeof TRANSCRIPT_TASK_IDS,
      TaskId,
    ][]
  ).find(([, id]) => id === taskId)
  return entry?.[0]
}

function handle(id: string): ObservationHandle {
  return {
    id: asObservationId(id),
    cancel() {
      /* no-op */
    },
  }
}

function renderApp(engine: EnginePort) {
  const presenter = createAppPresenter({
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
    loadWorkflows: createLoadWorkflowsUseCase(engine),
    loadResources: createLoadResourcesUseCase(engine),
    loadStatistics: createLoadStatisticsUseCase(engine),
    loadTask: createLoadTaskUseCase(engine),
    loadTaskChanges: createLoadTaskChangesUseCase(engine),
    loadHarnesses: createLoadHarnessesUseCase(engine),
    loadNeedsYou: createLoadNeedsYouUseCase(engine),
    loadWorkflowRun: createLoadWorkflowRunUseCase(engine),
    loadWorkflowEditor: createLoadWorkflowEditorUseCase(engine),
    loadWorkflowExecution: createLoadWorkflowExecutionUseCase(engine),
    loadParallelGroup: createLoadParallelGroupUseCase(engine),
  })
  render(<AppFeature presenter={presenter} />)
  return presenter
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  cleanup()
})

describe('Task transcript app integration', () => {
  it('opens a transcript task and toggles the Events pane', async () => {
    const user = userEvent.setup()
    const presenter = renderApp(transcriptEngine())
    await act(async () => {
      await flush()
    })
    act(() => {
      presenter.openTask(TRANSCRIPT_TASK_IDS.observed)
    })
    await act(async () => {
      await flush()
    })
    expect(screen.getByText('Original request')).toBeInTheDocument()
    expect(
      screen.getByText('Captured activity caught up'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Captured activity facts')).toBeNull()

    const toggle = screen.getByRole('button', { name: 'Toggle right pane' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Captured activity facts')).toBeInTheDocument()
    expect(
      screen.getByText(/Status: Done · independent of captured activity/),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('opens Events at load when the seed requests the pane', async () => {
    const presenter = renderApp(transcriptEngine())
    await act(async () => {
      await flush()
    })
    act(() => {
      presenter.openTask(TRANSCRIPT_TASK_IDS.partial)
    })
    await act(async () => {
      await flush()
    })
    act(() => {
      presenter.setTaskChangesPaneOpen(true)
    })
    expect(screen.getByText('Captured activity facts')).toBeInTheDocument()
    expect(
      screen.getByText('Unsupported record · public stub'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Status: Done · independent of captured activity/),
    ).toBeInTheDocument()
  })

  it('keeps unavailable observation from changing the Done badge text to a fake failure', async () => {
    const presenter = renderApp(transcriptEngine())
    await act(async () => {
      await flush()
    })
    act(() => {
      presenter.openTask(TRANSCRIPT_TASK_IDS.unavailable)
    })
    await act(async () => {
      await flush()
    })
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Original request unavailable')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Captured history unavailable · the read could not be completed',
      ),
    ).toBeInTheDocument()
  })
})
