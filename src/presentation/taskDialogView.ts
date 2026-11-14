import {
  takeoverAccessLabel,
  taskAllowsStopDialog,
  taskAllowsTakeoverDialog,
  wontBeStoppedTitles,
} from './taskOverflowMenu'
import type { TaskScreenState } from './taskState'

/** The confirmation dialog to draw, derived from observed facts. */
export type TaskDialogView =
  | { readonly kind: 'stop'; readonly wontBeStoppedTitles: readonly string[] }
  | { readonly kind: 'takeover'; readonly accessLabel: string }

/**
 * Null unless a dialog is requested, the observation is ready, and its status
 * still admits that dialog. Dialog rendering and the inert background share
 * this one decision.
 */
export function taskDialogView(state: TaskScreenState): TaskDialogView | null {
  if (state.dialog === null || state.load.kind !== 'ready') return null
  const observation = state.load.observation
  if (state.dialog === 'stop') {
    return taskAllowsStopDialog(observation)
      ? { kind: 'stop', wontBeStoppedTitles: wontBeStoppedTitles(observation) }
      : null
  }
  const accessLabel = takeoverAccessLabel(observation)
  if (
    accessLabel === null ||
    !taskAllowsTakeoverDialog(observation, state.commandChrome)
  ) {
    return null
  }
  return { kind: 'takeover', accessLabel }
}

export function taskDialogOpen(state: TaskScreenState): boolean {
  return taskDialogView(state) !== null
}
