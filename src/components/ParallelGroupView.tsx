import { useEffect, useRef } from 'react'
import type { ParallelGroupLoad, ParallelGroupObservation, TaskId } from '../model'
import { PARALLEL_GROUP_UNAVAILABLE } from '../model'
import { ParallelGroupLane } from './ParallelGroupLane'
import { ParallelGroupLoadingPage } from './skeleton'
import { TopbarMeta } from './TopbarMeta'
import {
  PARALLEL_GROUP_ACTION_EXPLANATION,
  PARALLEL_GROUP_ACTION_UNAVAILABLE_ID,
  PARALLEL_GROUP_HISTORY_EXPLANATION,
  PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID,
  PARALLEL_GROUP_LANE_EXPLANATION,
  PARALLEL_GROUP_LANE_UNAVAILABLE_ID,
  PARALLEL_GROUP_TOOL_EXPLANATION,
  PARALLEL_GROUP_TOOL_UNAVAILABLE_ID,
} from './parallelGroupUnavailable'

type Props = {
  readonly load: ParallelGroupLoad
  readonly showPrompt?: boolean
  readonly openMenuLaneId?: string | null
  readonly cancelAllConfirm?: boolean
  readonly onShowPrompt?: (show: boolean) => void
  readonly onOpenMenuLaneId?: (laneId: string | null) => void
  readonly onCancelAllConfirm?: (open: boolean) => void
  readonly onOpenTask?: (taskId: TaskId) => void
}

/**
 * Parallel group screen.
 * View prompt, lane menu, and Cancel-all dialog are interactive; Cancel all
 * confirm, Send, and Load current activity stay unavailable (no mutation).
 */
export function ParallelGroupView({
  load,
  showPrompt = false,
  openMenuLaneId = null,
  cancelAllConfirm = false,
  onShowPrompt,
  onOpenMenuLaneId,
  onCancelAllConfirm,
  onOpenTask,
}: Props) {
  if (load.kind === 'loading') {
    return <ParallelGroupLoadingPage laneCount={load.laneCount ?? 3} />
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const group = load.group
  if (group.lanes.length === 0) {
    if (group.emptyMessage) {
      return (
        <ParallelGroupChrome
          group={group}
          showPrompt={false}
          openMenuLaneId={null}
          cancelAllConfirm={false}
          empty
        />
      )
    }
    return <p role="status">{PARALLEL_GROUP_UNAVAILABLE}</p>
  }
  return (
    <ParallelGroupChrome
      group={group}
      showPrompt={showPrompt}
      openMenuLaneId={openMenuLaneId}
      cancelAllConfirm={cancelAllConfirm}
      {...(onShowPrompt ? { onShowPrompt } : {})}
      {...(onOpenMenuLaneId ? { onOpenMenuLaneId } : {})}
      {...(onCancelAllConfirm ? { onCancelAllConfirm } : {})}
      {...(onOpenTask ? { onOpenTask } : {})}
    />
  )
}

function ParallelGroupChrome({
  group,
  showPrompt,
  openMenuLaneId,
  cancelAllConfirm,
  empty = false,
  onShowPrompt,
  onOpenMenuLaneId,
  onCancelAllConfirm,
  onOpenTask,
}: {
  readonly group: ParallelGroupObservation
  readonly showPrompt: boolean
  readonly openMenuLaneId: string | null
  readonly cancelAllConfirm: boolean
  readonly empty?: boolean
  readonly onShowPrompt?: (show: boolean) => void
  readonly onOpenMenuLaneId?: (laneId: string | null) => void
  readonly onCancelAllConfirm?: (open: boolean) => void
  readonly onOpenTask?: (taskId: TaskId) => void
}) {
  const cancelAllRef = useRef<HTMLButtonElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  const floorClass =
    group.laneFloorPts === 360 ? ' hd-pl--floor-360' : ' hd-pl--floor-320'
  const badgeClass =
    group.badgeTone === 'done'
      ? 'hd-badge hd-badge--done'
      : group.badgeTone === 'failed'
        ? 'hd-badge hd-badge--failed'
        : group.badgeTone === 'running'
          ? 'hd-badge hd-badge--running'
          : group.badgeTone === 'neutral'
            ? 'hd-badge'
            : null

  useEffect(() => {
    if (!cancelAllConfirm) return
    dismissRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelAllConfirm?.(false)
        cancelAllRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = document.getElementById('pl-cancel-dialog')
      if (!dialog) return
      const buttons = [...dialog.querySelectorAll('button')]
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cancelAllConfirm, onCancelAllConfirm])

  const viewPromptDisabled = !group.viewPromptEnabled
  const main = (
    <>
      <p id={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_ACTION_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_LANE_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_LANE_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_TOOL_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_TOOL_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_HISTORY_EXPLANATION}
      </p>
      <div className="hd-topbar">
        <span className="hd-topbar__title">{group.title}</span>
        {group.statusLabel && badgeClass ? (
          <span className={badgeClass}>
            {group.badgeTone === 'running' ? (
              <span className="hd-badge__spin" aria-hidden="true" />
            ) : null}
            {group.statusLabel}
          </span>
        ) : null}
        {group.enforcementLabel ? (
          <TopbarMeta>{group.enforcementLabel}</TopbarMeta>
        ) : null}
        <span className="hd-topbar__spacer" />
        <button
          type="button"
          className="hd-btn hd-btn--ghost"
          disabled={viewPromptDisabled}
          aria-disabled={viewPromptDisabled || undefined}
          aria-pressed={viewPromptDisabled ? undefined : showPrompt}
          onClick={() => {
            if (viewPromptDisabled) return
            onShowPrompt?.(!showPrompt)
          }}
        >
          View prompt
        </button>
        {group.showCancelAll ? (
          <button
            ref={cancelAllRef}
            type="button"
            className="hd-btn hd-btn--danger"
            onClick={() => onCancelAllConfirm?.(true)}
          >
            Cancel all
          </button>
        ) : null}
      </div>
      {empty ? (
        <div className="hd-pl-empty">{group.emptyMessage}</div>
      ) : (
        <div
          className="hd-lanes"
          role="region"
          aria-label="Parallel group lanes"
          inert={cancelAllConfirm || undefined}
        >
          {group.lanes.map((lane) => (
            <ParallelGroupLane
              key={lane.id}
              lane={lane}
              showPrompt={showPrompt}
              menuOpen={openMenuLaneId === lane.id}
              onToggleMenu={() =>
                onOpenMenuLaneId?.(
                  openMenuLaneId === lane.id ? null : lane.id,
                )
              }
              onCloseMenu={() => onOpenMenuLaneId?.(null)}
              onOpenTask={(taskId) => onOpenTask?.(taskId)}
            />
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className={`hd-pl${floorClass}`} data-pl-state="">
      <div inert={cancelAllConfirm || undefined}>{main}</div>
      {cancelAllConfirm ? (
        <div className="hd-scrim">
          <div
            id="pl-cancel-dialog"
            className="hd-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pl-cancel-title"
          >
            <h2 className="hd-dialog__title" id="pl-cancel-title">
              Cancel every running task in this group?
            </h2>
            <div className="hd-dialog__actions">
              <button
                ref={dismissRef}
                type="button"
                className="hd-btn hd-btn--secondary"
                onClick={() => {
                  onCancelAllConfirm?.(false)
                  cancelAllRef.current?.focus()
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hd-btn hd-btn--danger"
                disabled
                aria-disabled="true"
                aria-describedby={PARALLEL_GROUP_ACTION_UNAVAILABLE_ID}
                title={PARALLEL_GROUP_ACTION_EXPLANATION}
              >
                Cancel all
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
