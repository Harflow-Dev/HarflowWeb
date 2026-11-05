import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Props = {
  readonly open: boolean
  readonly label: string
  readonly icon: Extract<IconName, 'folder' | 'harness' | 'shield'>
  readonly menuLabel: string
  readonly onToggle: () => void
  readonly children: ReactNode
}

export function PillMenu({
  open,
  label,
  icon,
  menuLabel,
  onToggle,
  children,
}: Props) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={`hd-pill${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon name={icon} />
        <span className="hd-pill__label">{label}</span>
        <Icon name="chevron-down" />
      </button>
      {open ? (
        <div
          className="hd-menu"
          role="menu"
          aria-label={menuLabel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 5,
            width: 300,
          }}
        >
          {children}
        </div>
      ) : null}
    </span>
  )
}
