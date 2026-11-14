import type { TaskObservation } from '../model'
import {
  TASK_COPY_RESUME_UNAVAILABLE_ID,
  TASK_OPEN_FINDER_UNAVAILABLE_ID,
  TASK_OPEN_TERMINAL_UNAVAILABLE_ID,
  TASK_OVERFLOW_COPY,
} from './taskOverflowCopy'
import {
  overflowItemAvailability,
  type OverflowActionId,
  type OverflowItemIcon,
  type OverflowMenuItemView,
  type OverflowMenuVariant,
  type OverflowUnavailableId,
} from './taskOverflowTypes'

/** Items before the separator, in design order. */
export function buildPrimaryItems(
  variant: OverflowMenuVariant,
  observation: TaskObservation,
): readonly OverflowMenuItemView[] {
  const parent = observation.parent
  return [
    ...action(variant, 'stop', 'stop', TASK_OVERFLOW_COPY.stopTask, {
      danger: true,
    }),
    // Take over names the access level it does not run under; without an
    // observed level the dialog copy cannot be written, so it is not offered.
    ...(observation.accessLevel
      ? action(variant, 'takeover', 'terminal', TASK_OVERFLOW_COPY.takeover)
      : []),
    ...unavailable(
      variant,
      'openTerminal',
      'terminal',
      TASK_OVERFLOW_COPY.openTerminal,
      TASK_OPEN_TERMINAL_UNAVAILABLE_ID,
    ),
    ...(parent
      ? action(variant, 'openParent', 'external', TASK_OVERFLOW_COPY.openParent, {
          hint: TASK_OVERFLOW_COPY.startedBy(parent.title),
        })
      : []),
    ...unavailable(
      variant,
      'copyResume',
      'terminal',
      TASK_OVERFLOW_COPY.copyResume,
      TASK_COPY_RESUME_UNAVAILABLE_ID,
    ),
    ...action(variant, 'copyTaskId', 'copy', TASK_OVERFLOW_COPY.copyTaskId),
  ]
}

/** Items after the separator (under the repository label). */
export function buildRepositoryItems(
  variant: OverflowMenuVariant,
): readonly OverflowMenuItemView[] {
  return [
    ...unavailable(
      variant,
      'openFinder',
      'folder',
      TASK_OVERFLOW_COPY.openFinder,
      TASK_OPEN_FINDER_UNAVAILABLE_ID,
    ),
    ...action(variant, 'copyPath', 'copy', TASK_OVERFLOW_COPY.copyPath),
  ]
}

function action(
  variant: OverflowMenuVariant,
  id: OverflowActionId,
  icon: OverflowItemIcon,
  label: string,
  extra: { readonly danger?: boolean; readonly hint?: string } = {},
): readonly OverflowMenuItemView[] {
  if (overflowItemAvailability(variant, id) !== 'action') return []
  return [{ id, icon, label, availability: 'action', ...extra }]
}

function unavailable(
  variant: OverflowMenuVariant,
  id: OverflowUnavailableId,
  icon: OverflowItemIcon,
  label: string,
  describedById: string,
): readonly OverflowMenuItemView[] {
  if (overflowItemAvailability(variant, id) !== 'unavailable') return []
  return [{ id, icon, label, availability: 'unavailable', describedById }]
}
