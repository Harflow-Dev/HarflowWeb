import { useEffect, useRef } from 'react'
import type { ParallelGroupLane as LaneModel, TaskId } from '../model'
import { queuedLaneTailView } from '../presentation/parallelGroupQueuedMessages'
import { Icon } from './Icon'
import { ParallelGroupQueuedMessages } from './ParallelGroupQueuedMessages'
import {
  HistoryBoundary,
  LaneBlock,
  LaneEndRow,
  LaneGlyph,
  LanePrompt,
} from './ParallelGroupLaneParts'
import {
  PARALLEL_GROUP_LANE_EXPLANATION,
  PARALLEL_GROUP_LANE_UNAVAILABLE_ID,
  PARALLEL_GROUP_OPEN_TASK_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

type Props = {
  readonly lane: LaneModel
  readonly showPrompt: boolean
  readonly menuOpen: boolean
  /** Seeded Cancel outcome for this group; null when none. */
  readonly queuedCancelOutcome: string | null
  readonly onToggleMenu: () => void
  readonly onCloseMenu: (focusTrigger: boolean) => void
  readonly onOpenTask: (taskId: TaskId) => void
}

/** One Parallel group lane with titled head, prompt, menu, and Send-only composer. */
export function ParallelGroupLane({
  lane,
  showPrompt,
  menuOpen,
  queuedCancelOutcome,
  onToggleMenu,
  onCloseMenu,
  onOpenTask,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeMenuRef = useRef(onCloseMenu)
  const menuRef = useRef<HTMLDivElement>(null)
  const openItemRef = useRef<HTMLButtonElement>(null)
  const messageLabel = `Message ${lane.composerName}`
  const formLabel = `${messageLabel}: ${lane.title}`
  const sendLabel = `Send to ${lane.composerName}`
  const placeholder =
    lane.composer.locked && lane.composer.placeholder
      ? lane.composer.placeholder
      : messageLabel
  const queueTail = queuedLaneTailView(lane, queuedCancelOutcome)

  // Latest callback without re-running the menu effect (it would re-steal focus).
  useEffect(() => {
    closeMenuRef.current = onCloseMenu
  })

  useEffect(() => {
    if (!menuOpen) return
    openItemRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault()
        closeMenuRef.current(true)
        triggerRef.current?.focus()
      }
    }
    function onPointer(event: MouseEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      closeMenuRef.current(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  return (
    <section className="hd-lane" aria-label={lane.title}>
      <div className="hd-lane__head">
        <LaneGlyph status={lane.status} />
        <div className="hd-pl-stack">
          <span className="hd-lane__title">{lane.title}</span>
          <span className="caption hd-faint hd-pl-cap">{lane.agentLabel}</span>
        </div>
        <span className="caption hd-pl-status">{lane.statusMeta}</span>
        <span className="hd-pl-menu-anchor">
          <button
            ref={triggerRef}
            type="button"
            className="hd-btn hd-btn--icon hd-btn--sm"
            aria-label="Lane actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <Icon name="more" />
          </button>
          {menuOpen ? (
            <div
              ref={menuRef}
              className="hd-menu"
              role="menu"
              aria-label="Lane actions"
            >
              <button
                ref={openItemRef}
                type="button"
                className="hd-menu__item"
                role="menuitem"
                disabled={lane.taskId === null}
                aria-disabled={lane.taskId === null || undefined}
                aria-describedby={
                  lane.taskId === null
                    ? PARALLEL_GROUP_OPEN_TASK_UNAVAILABLE_ID
                    : undefined
                }
                onClick={() => {
                  if (lane.taskId === null) return
                  onCloseMenu(false)
                  onOpenTask(lane.taskId)
                }}
              >
                <Icon name="external" />
                <span className="hd-menu__item-body">Open task</span>
              </button>
            </div>
          ) : null}
        </span>
      </div>
      <div className="hd-lane__body">
        {showPrompt ? <LanePrompt prompt={lane.prompt} /> : null}
        {lane.historyBoundary ? (
          <HistoryBoundary message={lane.historyBoundary} />
        ) : null}
        {lane.activityNote ? (
          <p className="hd-pl-note">{lane.activityNote}</p>
        ) : (
          lane.blocks.map((block, index) => (
            <LaneBlock key={`${lane.id}-${index}`} block={block} />
          ))
        )}
        <ParallelGroupQueuedMessages tail={queueTail} />
        {lane.end ? <LaneEndRow end={lane.end} /> : null}
      </div>
      {lane.status === 'pending' ? null : (
        <div className="hd-lane__foot">
          <form
            className="hd-composer"
            aria-label={formLabel}
            onSubmit={(event) => event.preventDefault()}
          >
            {lane.composer.locked ? <Icon name="lock" size="sm" /> : null}
            <label className="hd-sr" htmlFor={`msg-${lane.id}`}>
              {messageLabel}
            </label>
            <textarea
              id={`msg-${lane.id}`}
              className="hd-composer__input"
              rows={1}
              placeholder={placeholder}
              disabled
              aria-disabled="true"
              aria-describedby={PARALLEL_GROUP_LANE_UNAVAILABLE_ID}
            />
            <button
              type="submit"
              className="hd-composer__send"
              aria-label={sendLabel}
              disabled
              aria-disabled="true"
              aria-describedby={PARALLEL_GROUP_LANE_UNAVAILABLE_ID}
              title={PARALLEL_GROUP_LANE_EXPLANATION}
            >
              <Icon name="arrow-up" />
            </button>
          </form>
          {lane.composer.note ? (
            <p className="caption hd-pl-note">{lane.composer.note}</p>
          ) : null}
        </div>
      )}
    </section>
  )
}
