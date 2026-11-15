import type { TaskId } from '../model'
import {
  reconcileOverflowChrome,
  withoutCommandChrome,
  withoutTaskDialog,
  withOverflowMenuOpen,
  withSeededOverflowChrome,
  withTaskDialog,
} from './taskOverflowChrome'
import type {
  TaskCommandChrome,
  TaskDialogKind,
  TaskDialogOpener,
  TaskOverflowChrome,
  TaskScreenState,
} from './taskState'

export function withSeededCommandChrome(
  state: TaskScreenState,
  taskId: TaskId,
  chrome: TaskCommandChrome,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (state.load.kind !== 'ready') return null
  return reconcileOverflowChrome({ ...state, commandChrome: chrome })
}

export function clearedCommandChrome(
  state: TaskScreenState,
): TaskScreenState | null {
  return withoutCommandChrome(state)
}

export function overflowMenuOpenState(
  state: TaskScreenState,
  open: boolean,
): TaskScreenState | null {
  return withOverflowMenuOpen(state, open)
}

export function openedTaskDialogState(
  state: TaskScreenState,
  dialog: TaskDialogKind,
  opener: TaskDialogOpener | null,
): TaskScreenState {
  return reconcileOverflowChrome(withTaskDialog(state, dialog, opener))
}

export function closedTaskDialogState(
  state: TaskScreenState,
): TaskScreenState | null {
  return withoutTaskDialog(state)
}

export function seededOverflowChromeState(
  state: TaskScreenState,
  taskId: TaskId,
  chrome: TaskOverflowChrome,
): TaskScreenState | null {
  const next = withSeededOverflowChrome(state, taskId, chrome)
  return next ? reconcileOverflowChrome(next) : null
}
