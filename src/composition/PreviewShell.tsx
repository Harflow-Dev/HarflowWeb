import { useMemo, useState } from 'react'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import { resolveScenarioRoute } from '../adapters/mock/scenarioRoute'
import { AppFeature } from '../features'
import { createApp } from './createApp'
import { PreviewScenarioPanel } from './PreviewScenarioPanel'
import { usePreviewSeed } from './usePreviewSeed'

function initialScenarioFromLocation(): ScenarioId {
  const hash = window.location.hash.replace(/^#/, '')
  const search = new URLSearchParams(window.location.search).get('scenario')
  const raw = hash || search || 'populated'
  const resolved = resolveScenarioRoute(raw)
  if (resolved?.transcriptBase) {
    return (
      resolved.eventsPaneOpen
        ? `${resolved.transcriptBase}/events`
        : resolved.transcriptBase
    ) as ScenarioId
  }
  try {
    return scenarioById(raw).id
  } catch {
    return 'populated'
  }
}

/** Composition-owned preview route with scenario controls. */
export function PreviewShell() {
  const [scenario, setScenario] = useState<ScenarioId>(initialScenarioFromLocation)
  const app = useMemo(() => createApp(scenario), [scenario])
  const definition = scenarioById(scenario)
  const frame = definition.seed?.frame ?? 'default'
  usePreviewSeed(app.presenter, definition.seed)

  return (
    <div className="hw-preview">
      <PreviewScenarioPanel
        scenario={scenario}
        onSelect={setScenario}
        showResolveHeld={
          scenario === 'stale-response' || scenario === 'composer-starting'
        }
        onResolveHeld={() => app.mock.resolveHeldStart()}
      />
      <div
        className={
          frame === 'minimum'
            ? 'hw-preview__app hw-preview__app--minimum'
            : 'hw-preview__app'
        }
      >
        <AppFeature key={scenario} presenter={app.presenter} />
      </div>
    </div>
  )
}
