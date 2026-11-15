import { useRef, useState, type KeyboardEvent } from 'react'
import type { TaskPaneTab } from '../presentation/taskState'
import { Icon } from './Icon'
import { TASK_ARTIFACTS_UNAVAILABLE_ID } from './taskUnavailable'

/** Ids tying the tablist to the pane body it controls. */
export const TASK_PANE_PANEL_ID = 'task-pane-panel'
export const TASK_PANE_CHANGES_TAB_ID = 'task-pane-tab-changes'

type Props = {
  readonly changesCount: string | null
  readonly onSelectTab: (tab: TaskPaneTab) => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
}

type EnabledTab = TaskPaneTab

/**
 * Changes / Artifacts / Events tablist plus Close, matching design paneHtml.
 * Roving tabindex over the enabled tabs: Left/Right wrap, Home/End jump, and
 * the aria-disabled Artifacts tab is skipped. Arrow keys move focus only;
 * Enter or Space activates, as for a click.
 */
export function TaskPaneTabs({
  changesCount,
  onSelectTab,
  onClosePane,
  onUnavailable,
}: Props) {
  const refs = useRef<Record<EnabledTab, HTMLButtonElement | null>>({
    changes: null,
    events: null,
  })
  const [focused, setFocused] = useState<EnabledTab>('changes')
  const order: readonly EnabledTab[] = ['changes', 'events']

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const index = order.indexOf(focused)
    const target = nextTab(event.key, index, order.length)
    if (target === null) return
    event.preventDefault()
    const next = order[target]
    if (next !== undefined) refs.current[next]?.focus()
  }

  return (
    <div className="hd-pane__head">
      <div className="hd-tabs" role="tablist" onKeyDown={onKeyDown}>
        <button
          ref={(el) => {
            refs.current.changes = el
          }}
          id={TASK_PANE_CHANGES_TAB_ID}
          type="button"
          role="tab"
          aria-selected="true"
          aria-controls={TASK_PANE_PANEL_ID}
          tabIndex={focused === 'changes' ? 0 : -1}
          onFocus={() => setFocused('changes')}
          className="hd-tab is-active"
        >
          Changes
          {changesCount !== null ? (
            <>
              {' '}
              <span className="hd-tab__count">{changesCount}</span>
            </>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          aria-disabled="true"
          tabIndex={-1}
          className="hd-tab is-disabled"
          aria-describedby={TASK_ARTIFACTS_UNAVAILABLE_ID}
          onClick={() => onUnavailable('Artifacts')}
        >
          Artifacts
        </button>
        <button
          ref={(el) => {
            refs.current.events = el
          }}
          type="button"
          role="tab"
          aria-selected="false"
          tabIndex={focused === 'events' ? 0 : -1}
          onFocus={() => setFocused('events')}
          className="hd-tab"
          onClick={() => onSelectTab('events')}
        >
          Events
        </button>
      </div>
      <span className="hd-topbar__spacer" />
      <button
        type="button"
        className="hd-btn hd-btn--icon hd-btn--sm"
        aria-label="Close right pane"
        onClick={onClosePane}
      >
        <Icon name="x" />
      </button>
    </div>
  )
}

/** Index of the enabled tab a key moves focus to, or null for other keys. */
function nextTab(key: string, index: number, count: number): number | null {
  if (key === 'ArrowRight') return (index + 1) % count
  if (key === 'ArrowLeft') return (index - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}
