import type { Appearance, SettingsGeneralLoad } from '../model'
import { SettingsRuntimeSection, SettingsStoreSection } from './SettingsGeneralFacts'
import { SkelBlock, SkelStatus } from './skeletonPrimitives'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  readonly load: SettingsGeneralLoad
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
}

/**
 * Approved settings/general. Loading keeps every section, gap, and divider of
 * the loaded page; only the observed values become placeholders. Appearance
 * is the same element in every state, so the theme control is never remounted.
 */
export function SettingsGeneral({
  load,
  appearance,
  onAppearance,
  onUnavailable,
}: Props) {
  const loading = load.kind === 'loading'
  const observation = load.kind === 'ready' ? load.observation : null
  return (
    <>
      {loading ? <SkelStatus>Loading settings…</SkelStatus> : null}
      <AppearanceSection appearance={appearance} onAppearance={onAppearance} />
      <BehaviourSection loading={loading} />
      {load.kind === 'unavailable' ? (
        <p
          className="caption hd-faint"
          role="status"
          style={{ margin: 'var(--space-6) 0 0' }}
        >
          {load.message}
        </p>
      ) : (
        <>
          <SettingsRuntimeSection
            loading={loading}
            runtime={observation?.runtime ?? null}
            onUnavailable={onUnavailable}
          />
          <SettingsStoreSection
            loading={loading}
            taskStore={observation?.taskStore ?? null}
            onUnavailable={onUnavailable}
          />
        </>
      )}
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

function BehaviourSection({ loading }: { readonly loading: boolean }) {
  return (
    <section
      aria-label="Behaviour"
      aria-busy={loading ? true : undefined}
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
            {loading ? (
              <SkelBlock width={32} height={18} shape="pill" />
            ) : (
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
            )}
          </div>
        </div>
      ))}
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
