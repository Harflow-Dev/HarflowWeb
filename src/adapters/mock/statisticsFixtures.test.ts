import { describe, expect, it } from 'vitest'
import {
  completeFixtureConsistency,
  statisticsObservationFor,
  successPercentFromPopulation,
} from './statisticsFixtures'

describe('statistics fixture consistency', () => {
  it('keeps complete ranges aligned across chart, headline, and harness rows', () => {
    for (const range of ['7d', '30d'] as const) {
      const observation = statisticsObservationFor(range)
      expect(observation.coverage.kind).toBe('complete')
      const consistency = completeFixtureConsistency(observation)

      expect(consistency.harnessTasks).toBe(consistency.chartTasks)
      expect(consistency.chartTasks).toBe(observation.tasksRun)
      expect(consistency.harnessFailed).toBe(consistency.chartFailed)

      expect(observation.successRate.kind).toBe('reported')
      if (observation.successRate.kind !== 'reported') {
        throw new Error('expected reported success')
      }
      expect(observation.successRate.failedCount).toBe(consistency.chartFailed)
      expect(observation.successRate.failedCount).toBe(
        consistency.harnessFailed,
      )
      expect(observation.successRate.percent).toBe(
        successPercentFromPopulation(
          observation.tasksRun,
          consistency.chartFailed,
        ),
      )

      for (const harness of observation.byHarness) {
        if (harness.tasks === 0) {
          expect(harness.successRate.kind).toBe('suppressed')
          expect(harness.medianDuration.kind).toBe('suppressed')
          continue
        }
        expect(harness.successRate.kind).toBe('reported')
        if (harness.successRate.kind !== 'reported') {
          throw new Error('expected reported harness success')
        }
        expect(harness.successRate.percent).toBe(
          successPercentFromPopulation(
            harness.tasks,
            harness.successRate.failedCount,
          ),
        )
      }
    }
  })

  it('keeps observed zero cost distinct from unavailable in the 7d fixture', () => {
    const observation = statisticsObservationFor('7d')
    const opencode = observation.byHarness.find((r) => r.label === 'Opencode')
    const codex = observation.byHarness.find((r) => r.label === 'Codex')
    const antigravity = observation.byHarness.find(
      (r) => r.label === 'Antigravity',
    )
    expect(opencode?.cost).toEqual({ kind: 'reported', amountUsd: 0 })
    expect(codex?.cost).toEqual({ kind: 'unavailable' })
    expect(antigravity?.tasks).toBe(0)
  })
})
