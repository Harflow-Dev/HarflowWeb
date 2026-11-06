import { describe, expect, it } from 'vitest'
import {
  createLoadStatisticsUseCase,
  type EnginePort,
} from '../application'
import {
  asObservationId,
  asTaskId,
  type ObservationHandle,
  type StartTaskRequest,
  type StatisticsLoad,
  type StatisticsRangeId,
} from '../model'
import { statisticsLoadFor } from '../adapters/mock/statisticsFixtures'
import { StatisticsSession } from './statisticsSession'

function createCapturingPort(
  resolver: (range: StatisticsRangeId) => StatisticsLoad = statisticsLoadFor,
): {
  port: EnginePort
  capture: () => {
    range: StatisticsRangeId
    callback: (load: StatisticsLoad) => void
  } | null
  cancelCount: () => number
  rangesObserved: () => StatisticsRangeId[]
} {
  let latest: {
    range: StatisticsRangeId
    callback: (load: StatisticsLoad) => void
  } | null = null
  let cancels = 0
  const ranges: StatisticsRangeId[] = []
  const port: EnginePort = {
    observeContext() {
      return noopHandle('ctx')
    },
    observeWorkflows() {
      return noopHandle('wf')
    },
    observeResources() {
      return noopHandle('res')
    },
    observeStatistics(range, onUpdate) {
      ranges.push(range)
      latest = { range, callback: onUpdate }
      queueMicrotask(() => onUpdate(resolver(range)))
      return {
        id: asObservationId(`stats-${range}`),
        cancel() {
          cancels += 1
          if (latest?.callback === onUpdate) latest = null
        },
      }
    },
    observeTask() {
      return noopHandle('task')
    },
    observeTaskChanges() {
      return noopHandle('changes')
    },
    observeHarnesses() {
      return noopHandle('harnesses')
    },
    observeNeedsYou() {
      return noopHandle('needs')
    },
    async startTask(_request: StartTaskRequest) {
      return { kind: 'accepted', taskId: asTaskId('unused') }
    },
  }
  return {
    port,
    capture: () => latest,
    cancelCount: () => cancels,
    rangesObserved: () => ranges,
  }
}

function createDeferredPort(): {
  port: EnginePort
  publish: (range: StatisticsRangeId, load: StatisticsLoad) => void
} {
  const active = new Map<StatisticsRangeId, (load: StatisticsLoad) => void>()
  return {
    port: {
      observeContext() {
        return noopHandle('ctx')
      },
      observeWorkflows() {
        return noopHandle('wf')
      },
      observeResources() {
        return noopHandle('res')
      },
      observeStatistics(range, onUpdate) {
        active.set(range, onUpdate)
        if (range === '30d') {
          queueMicrotask(() => onUpdate(statisticsLoadFor('30d')))
        }
        return {
          id: asObservationId(`stats-${range}`),
          cancel() {
            if (active.get(range) === onUpdate) active.delete(range)
          },
        }
      },
      observeTask() {
        return noopHandle('task')
      },
      observeTaskChanges() {
        return noopHandle('changes')
      },
      observeHarnesses() {
        return noopHandle('harnesses')
      },
      observeNeedsYou() {
        return noopHandle('needs')
      },
      async startTask() {
        return { kind: 'accepted', taskId: asTaskId('unused') }
      },
    },
    publish(range, load) {
      active.get(range)?.(load)
    },
  }
}

function noopHandle(id: string): ObservationHandle {
  return {
    id: asObservationId(id),
    cancel() {
      /* no-op */
    },
  }
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('StatisticsSession', () => {
  it('loads distinct values for 7d and 30d ranges', async () => {
    const { port, rangesObserved } = createCapturingPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    await flush()
    expect(session.getState().selectedRange).toBe('30d')
    const thirty = session.getState().load
    expect(thirty.kind).toBe('ready')
    if (thirty.kind !== 'ready') throw new Error('expected ready')
    expect(thirty.observation.tasksRun).toBe(284)
    expect(thirty.observation.reportedCost).toEqual({
      kind: 'partial',
      amountUsd: 182.4,
      caption: "as reported by harness; 3 harnesses don't report cost",
    })

    session.selectRange('7d')
    expect(session.getState().load.kind).toBe('loading')
    await flush()
    const seven = session.getState().load
    expect(seven.kind).toBe('ready')
    if (seven.kind !== 'ready') throw new Error('expected ready')
    expect(seven.observation.range).toBe('7d')
    expect(seven.observation.tasksRun).toBe(76)
    expect(seven.observation.tasksRun).not.toBe(thirty.observation.tasksRun)
    expect(rangesObserved()).toEqual(['30d', '7d'])
    session.dispose()
  })

  it('keeps unknown/unavailable cost distinct from observed zero', async () => {
    const { port } = createCapturingPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    session.selectRange('7d')
    await flush()
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') throw new Error('expected ready')
    const opencode = load.observation.byHarness.find((r) => r.label === 'Opencode')
    const codex = load.observation.byHarness.find((r) => r.label === 'Codex')
    expect(opencode?.cost).toEqual({ kind: 'reported', amountUsd: 0 })
    expect(codex?.cost).toEqual({ kind: 'unavailable' })
    const antigravity = load.observation.byHarness.find(
      (r) => r.label === 'Antigravity',
    )
    expect(antigravity?.tasks).toBe(0)
    session.dispose()
  })

  it('suppresses derived metrics when coverage is incomplete', async () => {
    const { port } = createCapturingPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    session.selectRange('all')
    await flush()
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') throw new Error('expected ready')
    expect(load.observation.coverage.kind).toBe('incomplete')
    expect(load.observation.successRate.kind).toBe('suppressed')
    expect(load.observation.agentTime.kind).toBe('unknown')
    expect(load.observation.tasksRunCaption).toContain('not all-time')
    for (const row of load.observation.byHarness) {
      expect(row.successRate.kind).toBe('suppressed')
      expect(row.medianDuration.kind).toBe('suppressed')
    }
    session.dispose()
  })

  it('withholds reported success/median when incomplete coverage arrives raw', async () => {
    const thirty = statisticsLoadFor('30d')
    if (thirty.kind !== 'ready') throw new Error('expected ready fixture')
    const poisoned: StatisticsLoad = {
      kind: 'ready',
      observation: {
        ...thirty.observation,
        range: 'all',
        rangeLabel: 'All time',
        coverage: {
          kind: 'incomplete',
          reason: 'Deliberately incomplete with reported metrics attached.',
        },
        tasksRunCaption: 'Retained history (not all-time)',
        successRate: {
          kind: 'reported',
          percent: 91,
          failedCount: 26,
          caption: '26 failed',
        },
        byHarness: thirty.observation.byHarness.map((row) => ({
          ...row,
          successRate: {
            kind: 'reported' as const,
            percent: 94,
            failedCount: 1,
            caption: '94%',
          },
          medianDuration: { kind: 'reported' as const, display: '06:12' },
        })),
      },
    }
    const { port } = createCapturingPort((range) =>
      range === 'all' ? poisoned : statisticsLoadFor(range),
    )
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    session.selectRange('all')
    await flush()
    const load = session.getState().load
    expect(load.kind).toBe('ready')
    if (load.kind !== 'ready') throw new Error('expected ready')
    expect(load.observation.coverage.kind).toBe('incomplete')
    expect(load.observation.successRate).toEqual({
      kind: 'suppressed',
      reason: 'Incomplete population; success rate not computed.',
    })
    expect(load.observation.tasksRun).toBe(284)
    expect(load.observation.byHarness[0]?.cost).toEqual({
      kind: 'reported',
      amountUsd: 118.2,
    })
    for (const row of load.observation.byHarness) {
      expect(row.successRate.kind).toBe('suppressed')
      expect(row.medianDuration.kind).toBe('suppressed')
    }
    session.dispose()
  })

  it('rejects an old-range callback after selecting a new range', async () => {
    const { port, capture, cancelCount } = createCapturingPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    await flush()
    const old = capture()
    expect(old?.range).toBe('30d')
    const staleThirty = statisticsLoadFor('30d')

    session.selectRange('7d')
    expect(cancelCount()).toBe(1)
    expect(session.getState().selectedRange).toBe('7d')
    expect(session.getState().load.kind).toBe('loading')

    old?.callback(staleThirty)
    expect(session.getState().load.kind).toBe('loading')
    await flush()
    const current = session.getState().load
    expect(current.kind).toBe('ready')
    if (current.kind !== 'ready') throw new Error('expected ready')
    expect(current.observation.range).toBe('7d')
    expect(current.observation.tasksRun).toBe(76)
    session.dispose()
  })

  it('rejects captured callbacks after dispose or replacement', async () => {
    const { port, capture, cancelCount } = createCapturingPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    await flush()
    const first = capture()
    session.start()
    await flush()
    expect(cancelCount()).toBe(1)
    const afterReplace = session.getState().load
    first?.callback({
      kind: 'unavailable',
      message: 'stale replacement',
    })
    expect(session.getState().load).toEqual(afterReplace)

    const second = capture()
    session.dispose()
    expect(cancelCount()).toBe(2)
    second?.callback({
      kind: 'unavailable',
      message: 'stale dispose',
    })
    expect(session.getState().load).toEqual(afterReplace)
  })

  it('loading transition clears prior totals under the new range', async () => {
    const { port, publish } = createDeferredPort()
    const session = new StatisticsSession(createLoadStatisticsUseCase(port))
    session.start()
    await flush()
    expect(session.getState().load.kind).toBe('ready')
    session.selectRange('7d')
    expect(session.getState().selectedRange).toBe('7d')
    expect(session.getState().load).toEqual({ kind: 'loading' })
    publish('7d', statisticsLoadFor('7d'))
    const ready = session.getState().load
    expect(ready.kind).toBe('ready')
    if (ready.kind !== 'ready') throw new Error('expected ready')
    expect(ready.observation.tasksRun).toBe(76)
    session.dispose()
  })
})
