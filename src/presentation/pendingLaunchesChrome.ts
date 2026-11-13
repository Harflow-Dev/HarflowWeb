import type { PendingLaunchesScreenState } from './pendingLaunchesState'

/** Stop sheet covers the app only for a ready detail with Stop available. */
export function pendingStopDialogOpen(
  state: PendingLaunchesScreenState,
): boolean {
  if (!state.stopConfirm || state.selectedLaunchId === null) return false
  if (state.status.kind !== 'ready') return false
  const { status } = state.status
  if (status.stopOutcome !== null) return false
  return status.stopSupport === 'available'
}

/** Capability gate for the Pending launches nav item. */
export function pendingLaunchesNavVisible(
  state: PendingLaunchesScreenState,
): boolean {
  return state.capability.kind === 'ready' && state.capability.supported
}
