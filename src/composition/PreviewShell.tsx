import { useMemo, useState } from 'react'
import { SCENARIOS, type ScenarioId } from '../adapters/mock'
import { NewTaskFeature } from '../features'
import { createApp } from './createApp'

/** Composition-owned preview route with scenario controls. */
export function PreviewShell() {
  const [scenario, setScenario] = useState<ScenarioId>('populated')
  const app = useMemo(() => createApp(scenario), [scenario])

  return (
    <div className="hw-preview">
      <aside className="hw-preview__panel" aria-label="Mock scenarios">
        <h1 className="heading">Mock scenarios</h1>
        <p className="caption">
          Development preview only. Not part of the approved design composition.
        </p>
        <ul className="hw-preview__list">
          {SCENARIOS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  item.id === scenario
                    ? 'hw-preview__item is-active'
                    : 'hw-preview__item'
                }
                aria-pressed={item.id === scenario}
                onClick={() => setScenario(item.id)}
              >
                <span className="label">{item.label}</span>
                <span className="caption hd-faint">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
        {scenario === 'stale-response' ? (
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={() => app.mock.resolveHeldStart()}
          >
            Resolve held start
          </button>
        ) : null}
      </aside>
      <div className="hw-preview__app">
        <NewTaskFeature key={scenario} presenter={app.presenter} />
      </div>
    </div>
  )
}
