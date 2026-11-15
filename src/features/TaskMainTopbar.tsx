import { type ReactNode, type RefObject } from 'react'
import {
  Icon,
  TaskOverflowMenu,
} from '../components'
import { TaskTopbarChips } from '../components/TaskTopbarChips'
import { TASK_PANE_ASIDE_ID } from '../components/TaskPaneTabs'
import type { TaskId, TaskObservation } from '../model'
import {
  type TaskDialogOpener,
  type TaskScreenState,
  overflowMenuView,
  taskStatusView,
} from '../presentation'
import {
  taskTopbarChips,
  topbarOmitsMetaForPane,
  type EventsFactsRevealId,
} from '../presentation/taskTopbarChips'
import { handleOverflowAction } from './taskOverflowActions'
import { TaskStatusBadge } from './TaskStatusBadge'

type Props = {
  readonly title: string
  readonly state: TaskScreenState
  readonly ready: TaskObservation | null
  readonly showPane: boolean
  /** False when no pane can render (unavailable task): no toggle. */
  readonly paneAvailable: boolean
  readonly titleRef: RefObject<HTMLSpanElement | null>
  readonly paneToggleRef: RefObject<HTMLButtonElement | null>
  readonly moreRef: RefObject<HTMLButtonElement | null>
  readonly onToggleChangesPane: (open: boolean) => void
  readonly onRevealEventsFacts: (group: EventsFactsRevealId) => void
  readonly onToggleOverflowMenu: () => void
  readonly onCloseOverflowMenu: () => void
  readonly onOpenDialog: (
    dialog: 'stop' | 'takeover',
    opener: TaskDialogOpener,
  ) => void
  readonly onOpenParentTask: (taskId: TaskId) => void
  readonly onAnnounce: (message: string) => void
  readonly focusTitleFor: RefObject<TaskId | null>
}

/** Task title, badge, meta, facts chips, pane toggle, and overflow. */
export function TaskMainTopbar({
  title,
  state,
  ready,
  showPane,
  paneAvailable,
  titleRef,
  paneToggleRef,
  moreRef,
  onToggleChangesPane,
  onRevealEventsFacts,
  onToggleOverflowMenu,
  onCloseOverflowMenu,
  onOpenDialog,
  onOpenParentTask,
  onAnnounce,
  focusTitleFor,
}: Props): ReactNode {
  const readyView = ready ? taskStatusView(ready, state.commandChrome) : null
  const chips = ready ? taskTopbarChips(ready) : []
  const showMeta =
    ready &&
    readyView?.meta !== null &&
    !topbarOmitsMetaForPane(ready, showPane)
  const overflowMenu =
    ready && !state.overflowAnchorOmitted
      ? overflowMenuView(ready, state.commandChrome)
      : null

  return (
    <div className="hd-m05-bar">
      <span />
      <div className="hd-m05-bar__center">
        <span ref={titleRef} className="hd-topbar__title" tabIndex={-1}>
          {title}
        </span>
        {ready ? (
          <TaskStatusBadge
            observation={ready}
            commandChrome={state.commandChrome}
          />
        ) : null}
        {showMeta && readyView?.meta ? (
          <span className="hd-topbar__meta hw-m05-meta">{readyView.meta}</span>
        ) : null}
      </div>
      <div className="hd-m05-bar__right">
        {ready ? (
          <TaskTopbarChips chips={chips} onReveal={onRevealEventsFacts} />
        ) : null}
        {paneAvailable ? (
          <button
            ref={paneToggleRef}
            type="button"
            className={`hd-btn hd-btn--icon hd-btn--sm${showPane ? ' is-active' : ''}`}
            aria-label={showPane ? 'Hide right pane' : 'Show right pane'}
            aria-expanded={showPane}
            {...(showPane ? { 'aria-controls': TASK_PANE_ASIDE_ID } : {})}
            onClick={() => onToggleChangesPane(!showPane)}
          >
            <Icon name="panel-right" />
          </button>
        ) : null}
        {ready && overflowMenu ? (
          <TaskOverflowMenu
            menu={overflowMenu}
            open={state.overflowMenuOpen}
            moreRef={moreRef}
            onToggle={onToggleOverflowMenu}
            onClose={(focusTrigger) => {
              onCloseOverflowMenu()
              if (focusTrigger) moreRef.current?.focus()
            }}
            onAction={(id) =>
              handleOverflowAction(id, ready, {
                onOpenDialog,
                onOpenParentTask: (taskId) => {
                  focusTitleFor.current = taskId
                  onOpenParentTask(taskId)
                },
                onAnnounce,
              })
            }
          />
        ) : null}
      </div>
    </div>
  )
}
