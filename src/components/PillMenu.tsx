import { useId, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Props = {
  readonly open: boolean
  readonly label: string
  readonly icon: Extract<IconName, 'folder' | 'harness' | 'shield' | 'workflow'>
  readonly accent?: boolean
  readonly menuLabel: string
  /** Centered field pickers use a group panel, not a menuitem list. */
  readonly fields?: boolean
  readonly disabled?: boolean
  readonly onToggle: () => void
  readonly children: ReactNode
}

export function PillMenu({
  open,
  label,
  icon,
  accent = false,
  menuLabel,
  fields = false,
  disabled = false,
  onToggle,
  children,
}: Props) {
  const panelId = useId()
  const tone = accent ? ' hd-pill--accent' : ''
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={`hd-pill${tone}${open ? ' is-open' : ''}`}
        aria-haspopup={fields ? undefined : 'menu'}
        aria-expanded={open}
        aria-controls={fields ? panelId : undefined}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onClick={onToggle}
      >
        <Icon name={icon} />
        <span className="hd-pill__label">{label}</span>
        <Icon name="chevron-down" />
      </button>
      {open ? (
        <div
          id={fields ? panelId : undefined}
          className={fields ? 'hd-menu hd-m04-picker-menu' : 'hd-menu'}
          role={fields ? 'group' : 'menu'}
          aria-label={menuLabel}
          style={
            fields
              ? undefined
              : {
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 5,
                  width: 300,
                }
          }
        >
          {children}
        </div>
      ) : null}
    </span>
  )
}
