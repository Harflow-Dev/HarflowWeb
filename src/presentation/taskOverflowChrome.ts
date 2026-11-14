import type { TaskId } from '../model'
import type {
  TaskDialogKind,
  TaskDialogOpener,
  TaskOverflowChrome,
  TaskScreenState,
} from './taskState'

export function withOverflowMenuOpen(
  state: TaskScreenState,
  open: boolean,
): TaskScreenState | null {
  if (state.overflowMenuOpen === open) return null
  return { ...state, overflowMenuOpen: open }
}

export function withTaskDialog(
  state: TaskScreenState,
  dialog: TaskDialogKind,
  opener: TaskDialogOpener | null,
): TaskScreenState {
  return {
    ...state,
    overflowMenuOpen: false,
    dialog,
    dialogOpener: opener,
  }
}

export function withoutTaskDialog(
  state: TaskScreenState,
): TaskScreenState | null {
  if (state.dialog === null) return null
  return { ...state, dialog: null, dialogOpener: null }
}

export function withSeededOverflowChrome(
  state: TaskScreenState,
  taskId: TaskId,
  chrome: TaskOverflowChrome,
): TaskScreenState | null {
  if (state.selectedTaskId !== taskId) return null
  if (state.load.kind !== 'ready') return null
  return {
    ...state,
    overflowMenuOpen:
      chrome.overflowMenuOpen !== undefined
        ? chrome.overflowMenuOpen
        : state.overflowMenuOpen,
    dialog: chrome.dialog !== undefined ? chrome.dialog : state.dialog,
    dialogOpener:
      chrome.dialogOpener !== undefined
        ? chrome.dialogOpener
        : state.dialogOpener,
  }
}
