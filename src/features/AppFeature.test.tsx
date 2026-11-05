import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createLoadContextUseCase,
  createLoadResourcesUseCase,
  createLoadWorkflowsUseCase,
  createStartTaskUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asTaskId,
  type ContextLoad,
  type ObservationHandle,
  type ResourcesLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type WorkflowsLoad,
} from '../model'
import { createControllablePromise } from '../adapters/mock/controllable'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import { populatedResourcesLoad } from '../adapters/mock/resourceFixtures'
import { POPULATED_WORKFLOWS } from '../adapters/mock/workflowFixtures'
import { createAppPresenter } from '../presentation'
import { AppFeature } from './AppFeature'

function readyContext(): ContextLoad {
  return {
    kind: 'ready',
    composer: populatedComposer(),
    sidebar: populatedSidebar(),
  }
}

function createTestEngine(options?: {
  holdStart?: boolean
  workflows?: WorkflowsLoad
}): {
  port: EnginePort
  starts: StartTaskRequest[]
  resolveStart: (outcome: StartTaskOutcome) => void
} {
  const starts: StartTaskRequest[] = []
  let held = createControllablePromise<StartTaskOutcome>()
  const workflows: WorkflowsLoad = options?.workflows ?? {
    kind: 'ready',
    workflows: POPULATED_WORKFLOWS,
  }
  const resources: ResourcesLoad = populatedResourcesLoad()
  const port: EnginePort = {
    observeContext(onUpdate) {
      queueMicrotask(() => onUpdate(readyContext()))
      const handle: ObservationHandle = {
        id: asObservationId('ui-ctx'),
        cancel() {
          /* no-op */
        },
      }
      return handle
    },
    observeWorkflows(onUpdate) {
      queueMicrotask(() => onUpdate(workflows))
      return {
        id: asObservationId('ui-wf'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeResources(onUpdate) {
      queueMicrotask(() => onUpdate(resources))
      return {
        id: asObservationId('ui-res'),
        cancel() {
          /* no-op */
        },
      }
    },
    async startTask(request) {
      starts.push(request)
      if (options?.holdStart) {
        held = createControllablePromise<StartTaskOutcome>()
        return held.promise
      }
      return { kind: 'accepted', taskId: asTaskId('ui-task') }
    },
  }
  return {
    port,
    starts,
    resolveStart(outcome) {
      held.resolve(outcome)
    },
  }
}

function renderApp(engine: EnginePort) {
  const presenter = createAppPresenter({
    loadContext: createLoadContextUseCase(engine),
    startTask: createStartTaskUseCase(engine),
    loadWorkflows: createLoadWorkflowsUseCase(engine),
    loadResources: createLoadResourcesUseCase(engine),
  })
  const view = render(<AppFeature presenter={presenter} />)
  return { presenter, ...view }
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

describe('AppFeature navigation', () => {
  it('navigates between New task and Workflows without losing the draft', async () => {
    const user = userEvent.setup()
    const { port } = createTestEngine()
    renderApp(port)
    await flush()

    const prompt = await screen.findByLabelText('Task prompt')
    await user.type(prompt, 'draft across pages')
    expect(prompt).toHaveValue('draft across pages')

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    const main = screen.getByRole('main')
    expect(
      await within(main).findByRole('heading', { name: 'Workflows' }),
    ).toBeInTheDocument()
    expect(within(main).getByText('Nightly dependency audit')).toBeInTheDocument()
    expect(screen.queryByLabelText('Task prompt')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /New task/ }))
    const restored = await screen.findByLabelText('Task prompt')
    expect(restored).toHaveValue('draft across pages')
  })

  it('shows the empty workflows specimen and keeps create actions inert', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine({
      workflows: { kind: 'ready', workflows: [] },
    })
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(await screen.findByText('No workflows yet')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'New workflow (unavailable in this slice)',
      }),
    )
    expect(
      screen.getByText(/New workflow is unavailable in this exploratory slice/),
    ).toBeInTheDocument()
    expect(starts).toHaveLength(0)

    await user.click(
      screen.getByRole('button', {
        name: 'Describe one to an agent (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
  })

  it('keeps Run and Edit unavailable without launching', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    const row = await screen.findByText('Release checklist')
    const listItem = row.closest('[role="listitem"]')
    expect(listItem).not.toBeNull()
    await user.click(
      within(listItem as HTMLElement).getByRole('button', {
        name: 'Run Release checklist (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
    await user.click(
      within(listItem as HTMLElement).getByRole('button', {
        name: 'Edit Release checklist (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
    expect(screen.getByText('5 nodes')).toBeInTheDocument()
  })

  it('preserves appearance while switching pages', async () => {
    const user = userEvent.setup()
    const { port } = createTestEngine()
    const { container } = renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )
    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(container.querySelector('.hd-app')?.getAttribute('data-theme')).toBe(
      'dark',
    )
  })

  it('opens Resources with slot cards and keeps Install/Open task inert', async () => {
    const user = userEvent.setup()
    const { port, starts } = createTestEngine()
    renderApp(port)
    await flush()

    await user.click(screen.getByRole('button', { name: 'Resources' }))
    expect(
      await screen.findByRole('heading', { name: 'Resources' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 of 3 in use')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 in use')).toBeInTheDocument()
    expect(screen.getByText('1 waiting')).toBeInTheDocument()
    expect(screen.getByText('No tasks holding a slot.')).toBeInTheDocument()
    expect(screen.getByText('Not installed')).toBeInTheDocument()
    expect(screen.getByText('Waiting for a Codex slot')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Install Antigravity (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
    await user.click(
      screen.getByRole('button', {
        name: 'Open task Write contract fixtures for v1 tasks (unavailable in this slice)',
      }),
    )
    expect(starts).toHaveLength(0)
  })

  it('returns to the accepted launch state after navigating during a held start', async () => {
    const user = userEvent.setup()
    const { port, starts, resolveStart } = createTestEngine({ holdStart: true })
    renderApp(port)
    await flush()

    await user.type(screen.getByLabelText('Task prompt'), 'held launch')
    await user.click(screen.getByRole('button', { name: 'Start task' }))
    expect(screen.getByText('Starting task…')).toBeInTheDocument()
    expect(starts).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Workflows' }))
    expect(screen.getByText('Starting task…')).toBeInTheDocument()

    resolveStart({ kind: 'accepted', taskId: asTaskId('nav-ok') })
    await flush()
    expect(
      screen.getByText(/Accepted mock task nav-ok/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /New task/ }))
    expect(
      screen.getByText(/Accepted mock task nav-ok/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Task prompt')).toHaveValue('')
    expect(starts).toHaveLength(1)
  })
})
