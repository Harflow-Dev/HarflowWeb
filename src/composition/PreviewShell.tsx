import { useMemo, useState } from 'react'
import { scenarioById, type ScenarioId } from '../adapters/mock'
import { AppFeature } from '../features'
import { createApp } from './createApp'
import { PreviewScenarioPanel } from './PreviewScenarioPanel'
import { usePreviewSeed } from './usePreviewSeed'

/** Composition-owned preview route with scenario controls. */
export function PreviewShell() {
  const [scenario, setScenario] = useState<ScenarioId>('populated')
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
