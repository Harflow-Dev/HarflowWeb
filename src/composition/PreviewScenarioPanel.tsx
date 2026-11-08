import { SCENARIOS, type ScenarioId } from '../adapters/mock'

type Props = {
  readonly scenario: ScenarioId
  readonly onSelect: (id: ScenarioId) => void
  readonly showResolveHeld: boolean
  readonly onResolveHeld: () => void
}

/** Preview-only scenario list — not part of the approved product chrome. */
export function PreviewScenarioPanel(props: Props) {
  return (
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
                item.id === props.scenario
                  ? 'hw-preview__item is-active'
                  : 'hw-preview__item'
              }
              aria-pressed={item.id === props.scenario}
              onClick={() => props.onSelect(item.id)}
            >
              <span className="label">{item.label}</span>
              <span className="caption hd-faint">{item.description}</span>
            </button>
          </li>
        ))}
      </ul>
      {props.showResolveHeld ? (
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          onClick={props.onResolveHeld}
        >
          Resolve held start
        </button>
      ) : null}
    </aside>
  )
}
