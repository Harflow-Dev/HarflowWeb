import { SettingsPage } from '../components'
import type { Appearance, HarnessesLoad } from '../model'
import type { SettingsSection } from '../presentation'

type Props = {
  readonly section: SettingsSection
  readonly onSection: (section: SettingsSection) => void
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
  readonly harnesses: HarnessesLoad
  readonly generalLoading?: boolean
  readonly mcpApprovalsLoading?: boolean
}

/** Settings general page. Appearance is the shared session value. */
export function SettingsMain({
  section,
  onSection,
  appearance,
  onAppearance,
  onUnavailable,
  harnesses,
  generalLoading = false,
  mcpApprovalsLoading = false,
}: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll hd-thin-scroll">
        <SettingsPage
          section={section}
          onSection={onSection}
          appearance={appearance}
          onAppearance={onAppearance}
          onUnavailable={onUnavailable}
          harnesses={harnesses}
          generalLoading={generalLoading}
          mcpApprovalsLoading={mcpApprovalsLoading}
        />
      </div>
    </>
  )
}
