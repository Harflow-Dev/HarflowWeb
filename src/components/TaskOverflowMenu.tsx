import {
  useEffect,
  useRef,
  type MutableRefObject,
  type RefObject,
} from 'react'
import {
  TASK_OVERFLOW_COPY,
  type OverflowActionId,
  type OverflowMenuItemView,
  type OverflowMenuView,
} from '../presentation'
import { Icon } from './Icon'

type Props = {
  readonly menu: OverflowMenuView
  readonly open: boolean
  readonly onToggle: () => void
  readonly onClose: (focusTrigger: boolean) => void
  readonly onAction: (id: OverflowActionId) => void
  readonly moreRef?: RefObject<HTMLButtonElement | null>
}

/**
 * Task top-bar More actions menu. Opening focuses the first item; arrows
 * rove while focus is inside the menu; Escape closes and asks the caller to
 * restore focus to More; Tab and outside click close without moving focus.
 * Unavailable items stay in the roving order (aria-disabled, not native).
 */
export function TaskOverflowMenu({
  menu,
  open,
  onToggle,
  onClose,
  onAction,
  moreRef,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    firstItemRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current(true)
        return
      }
      if (event.key === 'Tab') {
        // Focus leaves the menu naturally; the menu does not stay open.
        closeRef.current(false)
        return
      }
      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'Home' &&
        event.key !== 'End'
      ) {
        return
      }
      const items = menuItems(menuRef.current)
      if (items.length === 0) return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !menuRef.current?.contains(active)) {
        return
      }
      event.preventDefault()
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      const next = nextIndex(event.key, index, items.length)
      items[next]?.focus()
    }
    function onPointer(event: MouseEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target) ||
        moreRef?.current?.contains(target)
      ) {
        return
      }
      closeRef.current(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, moreRef])

  return (
    <span className="hd-m05-more-anchor">
      <button
        ref={(node) => {
          triggerRef.current = node
          if (moreRef) {
            ;(moreRef as MutableRefObject<HTMLButtonElement | null>).current =
              node
          }
        }}
        type="button"
        className="hd-btn hd-btn--icon hd-btn--sm"
        aria-label={TASK_OVERFLOW_COPY.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon name="more" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          className="hd-menu hd-m05-menu"
          role="menu"
          aria-label={TASK_OVERFLOW_COPY.moreActions}
        >
          {menu.primary.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              {...(index === 0 ? { itemRef: firstItemRef } : {})}
              onAction={onAction}
            />
          ))}
          {menu.repository ? (
            <>
              <div className="hd-menu__sep" />
              <div className="hd-menu__label">{menu.repository.name}</div>
              {menu.repository.items.map((item) => (
                <MenuItem key={item.id} item={item} onAction={onAction} />
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </span>
  )
}

function MenuItem({
  item,
  itemRef,
  onAction,
}: {
  readonly item: OverflowMenuItemView
  readonly itemRef?: RefObject<HTMLButtonElement | null>
  readonly onAction: (id: OverflowActionId) => void
}) {
  const unavailable = item.availability === 'unavailable'
  return (
    <button
      ref={itemRef}
      type="button"
      role="menuitem"
      className={`hd-menu__item${item.danger ? ' hd-menu__item--danger' : ''}`}
      aria-disabled={unavailable || undefined}
      aria-describedby={
        item.availability === 'unavailable' ? item.describedById : undefined
      }
      onClick={() => {
        if (item.availability === 'unavailable') return
        onAction(item.id)
      }}
    >
      <Icon name={item.icon} />
      <span className="hd-menu__item-body">
        <span>{item.label}</span>
        {item.hint ? (
          <span className="hd-menu__item-hint">{item.hint}</span>
        ) : null}
      </span>
    </button>
  )
}

function menuItems(
  menu: HTMLDivElement | null,
): readonly HTMLButtonElement[] {
  if (!menu) return []
  return [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
}

function nextIndex(key: string, index: number, length: number): number {
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  if (key === 'ArrowDown') {
    return index < 0 ? 0 : (index + 1) % length
  }
  return index <= 0 ? length - 1 : index - 1
}
