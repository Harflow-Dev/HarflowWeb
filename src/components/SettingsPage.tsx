import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import type { Appearance, HarnessesLoad } from '../model'
import type { SettingsSection } from '../presentation'
import { Icon } from './Icon'
import { SettingsHarnesses } from './SettingsHarnesses'
import { ThemeToggle } from './ThemeToggle'

const SETTINGS_SECTIONS = ['general', 'harnesses'] as const

/** Manual tabs: arrows move focus; click, Enter, and Space select. */
function settingsTabId(section: SettingsSection): string {
  return `settings-tab-${section}`
}

function settingsPanelId(section: SettingsSection): string {
  return `settings-panel-${section}`
}

type Props = {
  readonly section: SettingsSection
  readonly onSection: (section: SettingsSection) => void
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
  readonly harnesses: HarnessesLoad
}

/**
 * Approved settings/general composition. Appearance writes the shared
 * session appearance. Other controls are read-only specimen facts or
 * explicitly unavailable — no runtime, store, notification, or OS effects.
 */
export function SettingsPage({
  section,
  onSection,
  appearance,
  onAppearance,
  onUnavailable,
  harnesses,
}: Props) {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'var(--space-5) var(--space-6) var(--space-7)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h1 className="hd-page__title" style={{ flex: 'none' }}>
        Settings
      </h1>
      <SettingsSectionTabs section={section} onSection={onSection} />
      <div
        role="tabpanel"
        id={settingsPanelId(section)}
        aria-labelledby={settingsTabId(section)}
        style={{ marginTop: 'var(--space-3)' }}
      >
        {section === 'harnesses' ? (
          <SettingsHarnesses load={harnesses} />
        ) : (
          <>
            <AppearanceSection
              appearance={appearance}
              onAppearance={onAppearance}
            />
            <BehaviourSection />
            <RuntimeSection onUnavailable={onUnavailable} />
            <StoreSection onUnavailable={onUnavailable} />
          </>
        )}
      </div>
    </div>
  )
}

function SettingsSectionTabs({
  section,
  onSection,
}: {
  readonly section: SettingsSection
  readonly onSection: (section: SettingsSection) => void
}) {
  const [roving, setRoving] = useState(section)
  const [trackedSection, setTrackedSection] = useState(section)
  const moving = useRef(false)
  const tabs = useRef(new Map<SettingsSection, HTMLButtonElement>())
  if (section !== trackedSection) {
    setTrackedSection(section)
    setRoving(section)
  }

  function focusTab(next: SettingsSection) {
    moving.current = true
    setRoving(next)
    tabs.current.get(next)?.focus()
    moving.current = false
  }

  function onKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    current: SettingsSection,
  ) {
    const next = tabFromKey(current, event.key)
    if (!next) return
    event.preventDefault()
    focusTab(next)
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (moving.current) return
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setRoving(section)
  }

  return (
    <div
      className="hd-tabs"
      role="tablist"
      aria-label="Settings sections"
      onBlur={onBlur}
    >
      {SETTINGS_SECTIONS.map((id) => (
        <button
          key={id}
          ref={(node) => {
            if (node) tabs.current.set(id, node)
            else tabs.current.delete(id)
          }}
          type="button"
          className={section === id ? 'hd-tab is-active' : 'hd-tab'}
          role="tab"
          id={settingsTabId(id)}
          aria-controls={settingsPanelId(id)}
          aria-selected={section === id}
          tabIndex={roving === id ? 0 : -1}
          onClick={() => {
            setRoving(id)
            onSection(id)
          }}
          onKeyDown={(event) => onKeyDown(event, id)}
        >
          {id === 'general' ? 'General' : 'Harnesses'}
        </button>
      ))}
    </div>
  )
}

function tabFromKey(
  current: SettingsSection,
  key: string,
): SettingsSection | null {
  const index = SETTINGS_SECTIONS.indexOf(current)
  if (key === 'ArrowRight') {
    return SETTINGS_SECTIONS[(index + 1) % SETTINGS_SECTIONS.length] ?? null
  }
  if (key === 'ArrowLeft') {
    return (
      SETTINGS_SECTIONS[
        (index - 1 + SETTINGS_SECTIONS.length) % SETTINGS_SECTIONS.length
      ] ?? null
    )
  }
  if (key === 'Home') return SETTINGS_SECTIONS[0] ?? null
  if (key === 'End') return SETTINGS_SECTIONS[SETTINGS_SECTIONS.length - 1] ?? null
  return null
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
