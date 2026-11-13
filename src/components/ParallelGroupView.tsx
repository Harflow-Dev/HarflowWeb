import { useEffect, useRef } from 'react'
import type { ParallelGroupLoad, ParallelGroupObservation, TaskId } from '../model'
import {
  PARALLEL_GROUP_EMPTY_MESSAGE,
  parallelGroupSkeletonLanes,
  parallelGroupTopBar,
} from '../presentation'
import { ParallelGroupLane } from './ParallelGroupLane'
import { ParallelGroupLoadingPage } from './skeleton'
import { TopbarMeta } from './TopbarMeta'
import {
  PARALLEL_GROUP_HISTORY_EXPLANATION,
  PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID,
  PARALLEL_GROUP_LANE_EXPLANATION,
  PARALLEL_GROUP_LANE_UNAVAILABLE_ID,
  PARALLEL_GROUP_OPEN_TASK_EXPLANATION,
  PARALLEL_GROUP_OPEN_TASK_UNAVAILABLE_ID,
  PARALLEL_GROUP_PROMPT_EXPLANATION,
  PARALLEL_GROUP_PROMPT_UNAVAILABLE_ID,
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
 * View prompt, the lane menu, and the Cancel-all trigger are interactive. The
 * Cancel-all dialog itself is app-level (ParallelGroupCancelDialog); Send,
 * Load current activity, and Cancel-all confirm stay unavailable (no mutation).
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
    return <ParallelGroupLoadingPage laneCount={parallelGroupSkeletonLanes(load)} />
  }
  if (load.kind === 'unavailable') {
    return <p role="status">{load.message}</p>
  }
  const group = load.group
  if (group.lanes.length === 0) {
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
  const wasConfirmOpen = useRef(false)
  const topBar = parallelGroupTopBar(group)
  const badgeClass =
    topBar.badgeTone === 'done'
      ? 'hd-badge hd-badge--done'
      : topBar.badgeTone === 'failed'
        ? 'hd-badge hd-badge--failed'
        : topBar.badgeTone === 'running'
          ? 'hd-badge hd-badge--running'
          : topBar.badgeTone === 'neutral'
            ? 'hd-badge'
            : null

  // Return focus to the trigger after the dialog closed and the app regions
  // are no longer inert (focus() on an inert element is lost to body).
  useEffect(() => {
    if (wasConfirmOpen.current && !cancelAllConfirm) {
      cancelAllRef.current?.focus()
    }
    wasConfirmOpen.current = cancelAllConfirm
  }, [cancelAllConfirm])

  const viewPromptDisabled = !topBar.viewPromptEnabled
  const layoutClass = topBar.harnessTitled ? '' : ' hd-pl--titled'
  return (
    <div className={`hd-pl${layoutClass}`}>
      <p id={PARALLEL_GROUP_LANE_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_LANE_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_TOOL_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_TOOL_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_HISTORY_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_HISTORY_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_PROMPT_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_PROMPT_EXPLANATION}
      </p>
      <p id={PARALLEL_GROUP_OPEN_TASK_UNAVAILABLE_ID} className="hd-sr">
        {PARALLEL_GROUP_OPEN_TASK_EXPLANATION}
      </p>
      <div className="hd-topbar">
        <span className="hd-topbar__title">{group.title}</span>
        {group.statusLabel && badgeClass ? (
          <span className={badgeClass}>
            {topBar.badgeTone === 'running' ? (
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
          aria-describedby={
            viewPromptDisabled ? PARALLEL_GROUP_PROMPT_UNAVAILABLE_ID : undefined
          }
          aria-pressed={viewPromptDisabled ? undefined : showPrompt}
          onClick={() => {
            if (viewPromptDisabled) return
            onShowPrompt?.(!showPrompt)
          }}
        >
          View prompt
        </button>
        {topBar.showCancelAll ? (
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
        <div className="hd-pl-empty">{PARALLEL_GROUP_EMPTY_MESSAGE}</div>
      ) : (
        <div
          className="hd-lanes"
          role="region"
          aria-label="Parallel group lanes"
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
    </div>
  )
}
