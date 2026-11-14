/** Leaf types and availability table shared by the overflow menu modules. */

/** Menu variant driven by the observed status read and command chrome. */
export type OverflowMenuVariant =
  | 'running'
  /** Running run with a Stop request acknowledged (composer "stopping"). */
  | 'stopping'
  | 'pending'
  | 'settled'
  | 'unavailable'

/** Items whose activation does something in this slice. */
export type OverflowActionId =
  | 'stop'
  | 'takeover'
  | 'openParent'
  | 'copyTaskId'
  | 'copyPath'

/** Items drawn but unavailable in the mock (aria-disabled, explained). */
export type OverflowUnavailableId =
  | 'openTerminal'
  | 'copyResume'
  | 'openFinder'

export type OverflowItemId = OverflowActionId | OverflowUnavailableId

export type OverflowItemAvailability = 'action' | 'unavailable'

export type OverflowItemIcon =
  | 'stop'
  | 'terminal'
  | 'external'
  | 'copy'
  | 'folder'

type ItemBase = {
  readonly label: string
  readonly icon: OverflowItemIcon
  readonly danger?: boolean
  readonly hint?: string
}

export type OverflowActionItemView = ItemBase & {
  readonly id: OverflowActionId
  readonly availability: 'action'
}

export type OverflowUnavailableItemView = ItemBase & {
  readonly id: OverflowUnavailableId
  readonly availability: 'unavailable'
  readonly describedById: string
}

export type OverflowMenuItemView =
  | OverflowActionItemView
  | OverflowUnavailableItemView

export type OverflowMenuView = {
  readonly variant: OverflowMenuVariant
  /** Items before the separator. */
  readonly primary: readonly OverflowMenuItemView[]
  /** Items after the separator, introduced by the repository label. */
  readonly repository: {
    readonly name: string
    readonly items: readonly OverflowMenuItemView[]
  }
}

/**
 * Exhaustive per-variant availability for each overflow item id.
 * Hidden items are omitted from the returned menu; this maps only shown ids.
 */
export function overflowItemAvailability(
  variant: OverflowMenuVariant,
  id: OverflowItemId,
): OverflowItemAvailability | 'hidden' {
  switch (id) {
    case 'stop':
      return variant === 'running' || variant === 'pending' ? 'action' : 'hidden'
    case 'takeover':
      return variant === 'running' ? 'action' : 'hidden'
    case 'openTerminal':
      return variant === 'settled' || variant === 'stopping'
        ? 'unavailable'
        : 'hidden'
    case 'openParent':
      return 'action'
    case 'copyResume':
      return variant === 'pending' || variant === 'unavailable'
        ? 'hidden'
        : 'unavailable'
    case 'copyTaskId':
      return 'action'
    case 'openFinder':
      return 'unavailable'
    case 'copyPath':
      return 'action'
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
