import type { Appearance } from '../model'
import { Icon } from './Icon'
import { ThemeToggle } from './ThemeToggle'

export function SettingsGeneral({
  appearance,
  onAppearance,
  onUnavailable,
}: {
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <>
      <AppearanceSection appearance={appearance} onAppearance={onAppearance} />
      <BehaviourSection />
      <RuntimeSection onUnavailable={onUnavailable} />
      <StoreSection onUnavailable={onUnavailable} />
    </>
  )
}

function AppearanceSection({
  appearance,
  onAppearance,
}: {
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
}) {
  return (
    <section
      aria-label="Appearance"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Appearance
      </h2>
      <div className="hd-form-row" style={{ minHeight: 40 }}>
        <div className="hd-form-row__label">
          Theme
          <span className="hd-form-row__hint">Also in the sidebar footer.</span>
        </div>
        <ThemeToggle
          appearance={appearance}
          onChange={onAppearance}
          labeled
        />
      </div>
    </section>
  )
}

const BEHAVIOUR: readonly { label: string; checked: boolean }[] = [
  { label: 'Open the window when a task starts', checked: false },
  { label: 'Notify when a task finishes', checked: true },
  { label: 'Notify when a request needs you', checked: true },
]

const BEHAVIOUR_EXPLANATION_ID = 'settings-behaviour-specimen'
const BEHAVIOUR_EXPLANATION =
  'Mock specimen values. These are not saved preferences or active notification settings.'

function BehaviourSection() {
  return (
    <section
      aria-label="Behaviour"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-6)',
      }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Behaviour
      </h2>
      <p id={BEHAVIOUR_EXPLANATION_ID} className="hd-sr">
        {BEHAVIOUR_EXPLANATION}
      </p>
      {BEHAVIOUR.map((row, index) => (
        <div key={row.label}>
          {index > 0 ? <FormRule /> : null}
          <div className="hd-form-row" style={{ minHeight: 40 }}>
            <div className="hd-form-row__label">{row.label}</div>
            <button
              type="button"
              className="hd-switch"
              role="switch"
              aria-checked={row.checked}
              aria-label={row.label}
              aria-disabled="true"
              aria-describedby={BEHAVIOUR_EXPLANATION_ID}
              disabled
            />
          </div>
        </div>
      ))}
    </section>
  )
}

function RuntimeSection({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <section
      aria-label="Harflow runtime"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-6)',
      }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Harflow runtime
      </h2>
      <div className="hd-form-row" style={{ minHeight: 40 }}>
        <div className="hd-form-row__label">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span className="hd-glyph hd-glyph--done" aria-hidden="true">
              <Icon name="check" size="sm" />
            </span>
            Harflow runtime 0.9.3 is ready
          </span>
        </div>
        <button
          type="button"
          className="hd-btn hd-btn--secondary"
          onClick={() => onUnavailable('Check for updates')}
        >
          Check for updates
        </button>
      </div>
    </section>
  )
}

function StoreSection({
  onUnavailable,
}: {
  readonly onUnavailable: (label: string) => void
}) {
  return (
    <section
      aria-label="Task store"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-6)',
      }}
    >
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Task store
      </h2>
      <div className="hd-form-row" style={{ minHeight: 40 }}>
        <div className="hd-form-row__label">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span className="hd-glyph hd-glyph--done" aria-hidden="true">
              <Icon name="check" size="sm" />
            </span>
            Task store is compatible
          </span>
        </div>
        <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            onClick={() => onUnavailable('Inspect task store')}
          >
            Inspect task store
          </button>
          <button
            type="button"
            className="hd-btn hd-btn--ghost"
            onClick={() => onUnavailable('Show backup in Finder')}
          >
            Show backup in Finder
          </button>
        </span>
      </div>
    </section>
  )
}

function FormRule() {
  return (
    <hr
      style={{
        border: 0,
        borderTop: '1px solid var(--border)',
        margin: '0 0 var(--space-3)',
      }}
    />
  )
}
