import { describe, expect, it } from 'vitest'
import { scenarioById } from './scenarios'
import { resolveScenarioRoute, TRANSCRIPT_BASES } from './scenarioRoute'

describe('resolveScenarioRoute', () => {
  it.each([...TRANSCRIPT_BASES])(
    'opens Events for %s/events without manual pane state',
    (base) => {
      const closed = resolveScenarioRoute(base)
      expect(closed).toEqual({
        scenarioId: base,
        eventsPaneOpen: false,
        transcriptBase: base,
      })
      const open = resolveScenarioRoute(`${base}/events`)
      expect(open).toEqual({
        scenarioId: base,
        eventsPaneOpen: true,
        transcriptBase: base,
      })
      const design = resolveScenarioRoute(`task/${base}/events`)
      expect(design?.eventsPaneOpen).toBe(true)
      expect(design?.transcriptBase).toBe(base)

      const definition = scenarioById(`${base}/events`)
      expect(definition.seed?.eventsPaneOpen).toBe(true)
      expect(definition.seed?.openTaskId).toBeTruthy()
    },
  )
})
