import { describe, expect, it } from 'vitest'
import { idleObservation } from '../adapters/mock/mockObservation'
import { stubPendingLaunchPort } from '../adapters/mock/stubPendingLaunchPort'
import { createLoadHarnessesUseCase, type EnginePort } from '../application'
import {
  asObservationId,
  asTaskId,
  type HarnessesLoad,
  type ObservationHandle,
  type StartTaskRequest,
} from '../model'
import {
  populatedHarnessesLoad,
  unavailableHarnessesLoad,
} from '../adapters/mock/harnessFixtures'
import { HarnessesSession } from './harnessesSession'

function createCapturingPort(): {
  port: EnginePort
  capture: () => ((load: HarnessesLoad) => void) | null
} {
  let latest: ((load: HarnessesLoad) => void) | null = null
  const port: EnginePort = {
    observeContext() {
      return noopHandle('ctx')
    },
    observeWorkflows() {
      return noopHandle('wf')
    },
    observeWorkflowRun() {
      return noopHandle('workflow-run')
    },
    observeWorkflowEditor() {
      return noopHandle('workflow-editor')
    },
    observeWorkflowExecution() {
      return noopHandle('workflow-execution')
    },
    observeResources() {
      return noopHandle('res')
    },
    observeParallelGroup() {
      return noopHandle('parallel-group')
    },
    ...stubPendingLaunchPort(),
    observeStatistics() {
      return noopHandle('stats')
    },
    observeTask() {
      return noopHandle('task')
    },
    observeTaskChanges() {
      return noopHandle('changes')
    },
    observeTaskEventsOlder() {
      return idleObservation()
    },
    observeTaskEvents() {
      return noopHandle('events')
    },
    observeHarnesses(onUpdate) {
      latest = onUpdate
      return {
        id: asObservationId('harnesses'),
        cancel() {
          if (latest === onUpdate) latest = null
        },
      }
    },
    observeSettingsGeneral() {
      return {
        id: asObservationId('unused-settings-general'),
        cancel() {
          /* no-op */
        },
      }
    },
    observeNeedsYou() {
      return noopHandle('needs')
    },
    async startTask(_request: StartTaskRequest) {
      return { kind: 'accepted', taskId: asTaskId('unused') }
    },
  }
  return { port, capture: () => latest }
}

function noopHandle(id: string): ObservationHandle {
  return {
    id: asObservationId(id),
    cancel() {
      /* no-op */
    },
  }
}

describe('HarnessesSession', () => {
  it('rejects a captured callback after replacement and disposal', () => {
    const { port, capture } = createCapturingPort()
    const session = new HarnessesSession(createLoadHarnessesUseCase(port))
    session.start()
    const first = capture()
    expect(first).toEqual(expect.any(Function))
    first!(populatedHarnessesLoad())
    expect(session.getState().load.kind).toBe('ready')

    session.start()
    expect(session.getState().load.kind).toBe('loading')
    first!(populatedHarnessesLoad())
    expect(session.getState().load.kind).toBe('loading')

    const second = capture()
    second!(unavailableHarnessesLoad())
    expect(session.getState().load).toEqual(unavailableHarnessesLoad())
    first!(populatedHarnessesLoad())
    expect(session.getState().load.kind).toBe('unavailable')

    session.dispose()
    second!(populatedHarnessesLoad())
    expect(session.getState().load.kind).toBe('unavailable')
  })

  it('clears ready facts when the current observation becomes unavailable', () => {
    const { port, capture } = createCapturingPort()
    const session = new HarnessesSession(createLoadHarnessesUseCase(port))
    session.start()
    const current = capture()
    current!(populatedHarnessesLoad())
    expect(JSON.stringify(session.getState())).toContain('Claude Code')
    current!(unavailableHarnessesLoad())
    const encoded = JSON.stringify(session.getState())
    expect(encoded).not.toContain('Claude Code')
    expect(encoded).not.toContain('Installed')
    expect(encoded).not.toContain('Ready')
    expect(session.getState().load).toEqual(unavailableHarnessesLoad())
  })

  it('collapses an expanded id missing from a ready observation and keeps a present one', () => {
    const { port, capture } = createCapturingPort()
    const session = new HarnessesSession(createLoadHarnessesUseCase(port))
    session.start()
    session.setExpandedId('claude-code')
    expect(session.getState().expandedId).toBe('claude-code')
    capture()!(populatedHarnessesLoad())
    expect(session.getState().expandedId).toBe('claude-code')

    session.setExpandedId('no-such-harness')
    capture()!(populatedHarnessesLoad())
    expect(session.getState().expandedId).toBeNull()

    session.setExpandedId('no-such-harness')
    capture()!(unavailableHarnessesLoad())
    expect(session.getState().expandedId).toBe('no-such-harness')
  })
})
