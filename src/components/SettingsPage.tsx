import type { Appearance, HarnessesLoad } from '../model'
import type { SettingsSection } from '../presentation'
import { SettingsGeneral } from './SettingsGeneral'
import { SettingsHarnesses } from './SettingsHarnesses'
import { SettingsSectionPanel, SettingsSectionTabs } from './SettingsSectionTabs'

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
      <SettingsSectionPanel section={section}>
        {section === 'harnesses' ? (
          <SettingsHarnesses load={harnesses} />
        ) : (
          <SettingsGeneral
            appearance={appearance}
            onAppearance={onAppearance}
            onUnavailable={onUnavailable}
          />
        )}
      </SettingsSectionPanel>
    </div>
  )
}
