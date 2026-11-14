import type { TaskObservation } from '../model'
import {
  TASK_COPY_RESUME_UNAVAILABLE_ID,
  TASK_OPEN_FINDER_UNAVAILABLE_ID,
  TASK_OPEN_TERMINAL_UNAVAILABLE_ID,
  TASK_OVERFLOW_COPY,
} from './taskOverflowCopy'
import {
  overflowItemAvailability,
  type OverflowItemId,
  type OverflowItemIcon,
  type OverflowMenuItemView,
  type OverflowMenuVariant,
} from './taskOverflowMenu'

/** Build ordered overflow items for one menu variant and observation. */
export function buildOverflowItems(
  variant: OverflowMenuVariant,
  observation: TaskObservation,
): readonly OverflowMenuItemView[] {
  const head = [
    ...item(variant, 'stop', 'stop', TASK_OVERFLOW_COPY.stopTask, true),
    ...item(variant, 'takeover', 'terminal', TASK_OVERFLOW_COPY.takeover),
    ...item(
      variant,
      'openTerminal',
      'terminal',
      TASK_OVERFLOW_COPY.openTerminal,
      false,
      TASK_OPEN_TERMINAL_UNAVAILABLE_ID,
    ),
  ]
  const parent = observation.parent
    ? [
        {
          id: 'openParent' as const,
          label: TASK_OVERFLOW_COPY.openParent,
          icon: 'external' as const,
          hint: TASK_OVERFLOW_COPY.startedBy(observation.parent.title),
          availability: 'action' as const,
        },
      ]
    : []
  return [
    ...head,
    ...parent,
    ...item(
      variant,
      'copyResume',
      'terminal',
      TASK_OVERFLOW_COPY.copyResume,
      false,
      TASK_COPY_RESUME_UNAVAILABLE_ID,
    ),
    fixed('copyTaskId', 'copy', TASK_OVERFLOW_COPY.copyTaskId, 'action'),
    fixed(
      'openFinder',
      'folder',
      TASK_OVERFLOW_COPY.openFinder,
      'unavailable',
      TASK_OPEN_FINDER_UNAVAILABLE_ID,
    ),
    fixed('copyPath', 'copy', TASK_OVERFLOW_COPY.copyPath, 'action'),
  ]
}

function item(
  variant: OverflowMenuVariant,
  id: OverflowItemId,
  icon: OverflowItemIcon,
  label: string,
  danger = false,
  describedById?: string,
): readonly OverflowMenuItemView[] {
  const availability = overflowItemAvailability(variant, id)
  if (availability === 'hidden') return []
  return [fixed(id, icon, label, availability, describedById, danger)]
}

function fixed(
  id: OverflowItemId,
  icon: OverflowItemIcon,
  label: string,
  availability: 'action' | 'unavailable',
  describedById?: string,
  danger = false,
): OverflowMenuItemView {
  return {
    id,
    label,
    icon,
    availability,
    ...(danger ? { danger: true } : {}),
    ...(describedById ? { describedById } : {}),
  }
}
