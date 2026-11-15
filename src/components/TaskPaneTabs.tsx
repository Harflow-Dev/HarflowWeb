import type { TaskPaneTab } from '../presentation/taskState'
import { Icon } from './Icon'
import { TASK_ARTIFACTS_UNAVAILABLE_ID } from './taskUnavailable'

type Props = {
  readonly changesCount: string | null
  readonly onSelectTab: (tab: TaskPaneTab) => void
  readonly onClosePane: () => void
  readonly onUnavailable: (label: string) => void
}

/** Changes / Artifacts / Events tablist plus Close, matching design paneHtml. */
export function TaskPaneTabs({
  changesCount,
  onSelectTab,
  onClosePane,
  onUnavailable,
}: Props) {
  return (
    <div className="hd-pane__head">
      <div className="hd-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected="true"
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
          className="hd-tab is-disabled"
          aria-describedby={TASK_ARTIFACTS_UNAVAILABLE_ID}
          onClick={() => onUnavailable('Artifacts')}
        >
          Artifacts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
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
