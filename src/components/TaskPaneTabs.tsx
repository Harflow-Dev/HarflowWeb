import { useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from './Icon'
import { TASK_ARTIFACTS_UNAVAILABLE_ID } from './taskUnavailable'

/** Ids tying the tablist to the pane body it controls. */
export const TASK_PANE_PANEL_ID = 'task-pane-panel'
export const TASK_PANE_CHANGES_TAB_ID = 'task-pane-tab-changes'
export const TASK_PANE_EVENTS_TAB_ID = 'task-pane-tab-events'

type Props = {
  readonly changesCount: string | null
  readonly activeTab?: 'changes' | 'events'
  readonly onSelectTab?: (tab: 'changes' | 'events') => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
}

type TabKey = 'changes' | 'artifacts' | 'events'
const ORDER: readonly TabKey[] = ['changes', 'artifacts', 'events']

/**
 * Changes / Artifacts / Events tablist plus Close, matching design paneHtml.
 * Roving tabindex over every tab: Left/Right wrap and Home/End jump.
 * Events is enabled when onSelectTab is provided. Artifacts stay unavailable.
 */
export function TaskPaneTabs({
  changesCount,
  activeTab = 'changes',
  onSelectTab,
  onClosePane,
  onUnavailable,
}: Props) {
  const refs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    changes: null,
    artifacts: null,
    events: null,
  })
  const [focused, setFocused] = useState<TabKey>(activeTab)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      (focused === 'changes' || focused === 'events')
    ) {
      event.preventDefault()
      if (focused === 'events' && onSelectTab === undefined) {
        onUnavailable('Open Events')
        return
      }
      onSelectTab?.(focused)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (focused === 'artifacts') {
        event.preventDefault()
        onUnavailable('Artifacts')
      }
      return
    }
    const target = nextTab(event.key, ORDER.indexOf(focused), ORDER.length)
    if (target === null) return
    event.preventDefault()
    const next = ORDER[target]
    if (next !== undefined) refs.current[next]?.focus()
  }

  const tabProps = (key: TabKey) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[key] = el
    },
    role: 'tab' as const,
    type: 'button' as const,
    tabIndex: focused === key ? 0 : -1,
    onFocus: () => setFocused(key),
  })

  const eventsEnabled = onSelectTab !== undefined
  const eventsSelected = activeTab === 'events'

  return (
    <div className="hd-pane__head">
      <div className="hd-tabs" role="tablist" onKeyDown={onKeyDown}>
        <button
          {...tabProps('changes')}
          id={TASK_PANE_CHANGES_TAB_ID}
          aria-selected={activeTab === 'changes' ? 'true' : 'false'}
          aria-controls={TASK_PANE_PANEL_ID}
          className={
            activeTab === 'changes' ? 'hd-tab is-active' : 'hd-tab'
          }
          onClick={() => onSelectTab?.('changes')}
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
          {...tabProps('artifacts')}
          aria-selected="false"
          aria-disabled="true"
          className="hd-tab is-disabled"
          aria-describedby={TASK_ARTIFACTS_UNAVAILABLE_ID}
          onClick={() => onUnavailable('Artifacts')}
        >
          Artifacts
        </button>
        <button
          {...tabProps('events')}
          id={TASK_PANE_EVENTS_TAB_ID}
          aria-selected={eventsSelected ? 'true' : 'false'}
          aria-controls={eventsEnabled ? TASK_PANE_PANEL_ID : undefined}
          className={eventsSelected ? 'hd-tab is-active' : 'hd-tab'}
          onClick={() => {
            if (eventsEnabled) onSelectTab('events')
            else onUnavailable('Open Events')
          }}
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
