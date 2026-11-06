import { SettingsPage } from '../components'
import type { Appearance } from '../model'

type Props = {
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
  readonly onUnavailable: (label: string) => void
}

/** Settings general page. Appearance is the shared session value. */
export function SettingsMain({
  appearance,
  onAppearance,
  onUnavailable,
}: Props) {
  return (
    <>
      <div className="hd-topbar">
        <span className="hd-topbar__spacer" />
      </div>
      <div className="hd-scroll">
        <SettingsPage
          appearance={appearance}
          onAppearance={onAppearance}
          onUnavailable={onUnavailable}
        />
      </div>
    </>
  )
}
