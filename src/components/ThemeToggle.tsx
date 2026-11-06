import type { Appearance } from '../model'
import { Icon } from './Icon'

type Props = {
  readonly appearance: Appearance
  readonly onChange: (appearance: Appearance) => void
  readonly compact?: boolean
  /** Text labels for the Settings theme row. Same appearance state as the sidebar. */
  readonly labeled?: boolean
}

const LABELS: readonly { id: Appearance; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export function ThemeToggle({
  appearance,
  onChange,
  compact = false,
  labeled = false,
}: Props) {
  if (labeled) {
    return (
      <div className="hd-theme" role="group" aria-label="Theme">
        {LABELS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="hd-theme__item"
            aria-pressed={appearance === item.id}
            onClick={() => onChange(item.id)}
            style={{
              width: 'auto',
              padding: '0 var(--space-3)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  if (compact) {
    const nextLabel =
      appearance === 'system'
        ? 'Appearance: System. Switch to Light'
        : appearance === 'light'
          ? 'Appearance: Light. Switch to Dark'
          : 'Appearance: Dark. Switch to System'
    const icon =
      appearance === 'system' ? 'monitor' : appearance === 'light' ? 'sun' : 'moon'
    return (
      <button
        type="button"
        className="hd-rail-item"
        aria-label={nextLabel}
        title="Appearance"
        onClick={() => {
          const order: Appearance[] = ['system', 'light', 'dark']
          const i = order.indexOf(appearance)
          onChange(order[(i + 1) % order.length] ?? 'system')
        }}
      >
        <Icon name={icon} />
      </button>
    )
  }

  return (
    <div className="hd-theme" role="group" aria-label="Appearance">
      <button
        type="button"
        className="hd-theme__item"
        aria-pressed={appearance === 'system'}
        aria-label="System"
        title="System, follows this computer"
        onClick={() => onChange('system')}
      >
        <Icon name="monitor" size="sm" />
      </button>
      <button
        type="button"
        className="hd-theme__item"
        aria-pressed={appearance === 'light'}
        aria-label="Light"
        title="Light"
        onClick={() => onChange('light')}
      >
        <Icon name="sun" size="sm" />
      </button>
      <button
        type="button"
        className="hd-theme__item"
        aria-pressed={appearance === 'dark'}
        aria-label="Dark"
        title="Dark"
        onClick={() => onChange('dark')}
      >
        <Icon name="moon" size="sm" />
      </button>
    </div>
  )
}
