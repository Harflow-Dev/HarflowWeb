import type { TaskId } from '../model'
import { taskDialogView } from './taskDialogView'
import { overflowMenuView } from './taskOverflowMenu'
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

/**
 * Drop menu/dialog chrome the current load no longer supports: the load left
 * ready, the screen draws no More anchor, or the status no longer admits the
 * requested dialog. Returns the same state when nothing changes.
 */
export function reconcileOverflowChrome(
  state: TaskScreenState,
): TaskScreenState {
  const menuValid =
    state.load.kind === 'ready' &&
    overflowMenuView(state.load.observation, state.commandChrome) !== null
  const closeMenu = state.overflowMenuOpen && !menuValid
  const closeDialog = state.dialog !== null && taskDialogView(state) === null
  if (!closeMenu && !closeDialog) return state
  return {
    ...state,
    overflowMenuOpen: closeMenu ? false : state.overflowMenuOpen,
    dialog: closeDialog ? null : state.dialog,
    dialogOpener: closeDialog ? null : state.dialogOpener,
  }
}

/** Drop command lifecycle and overflow chrome; null when already clear. */
export function withoutCommandChrome(
  state: TaskScreenState,
): TaskScreenState | null {
  if (
    state.commandChrome === null &&
    !state.overflowMenuOpen &&
    state.dialog === null
  ) {
    return null
  }
  return {
    ...state,
    commandChrome: null,
    overflowMenuOpen: false,
    dialog: null,
    dialogOpener: null,
  }
}
