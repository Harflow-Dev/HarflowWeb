import { useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import type { SettingsSection } from '../presentation'

const SETTINGS_SECTIONS = ['general', 'harnesses'] as const

/** Manual tabs: arrows move focus; click, Enter, and Space select. */
function settingsTabId(section: SettingsSection): string {
  return `settings-tab-${section}`
}

function settingsPanelId(section: SettingsSection): string {
  return `settings-panel-${section}`
}

export function SettingsSectionTabs({
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

export function SettingsSectionPanel({
  section,
  children,
}: {
  readonly section: SettingsSection
  readonly children: ReactNode
}) {
  return (
    <div
      role="tabpanel"
      id={settingsPanelId(section)}
      aria-labelledby={settingsTabId(section)}
      style={{ marginTop: 'var(--space-3)' }}
    >
      {children}
    </div>
  )
}
