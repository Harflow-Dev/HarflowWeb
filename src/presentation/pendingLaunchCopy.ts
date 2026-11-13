/**
 * Exact pending-launch product copy from HarflowDesign
 * `83d820f` / `v2/docs/decisions/pending-launch-discovery.md`.
 * Do not invent strings here.
 */

export const PENDING_COPY = {
  inventoryHeading: 'Pending launches',
  inventoryLead: 'Select a launch to check its status.',
  loadingHeading: 'Checking pending launches',
  loadingLead: 'Checking this engine for pending launches…',
  emptyHeading: 'No pending launches observed',
  emptyLead:
    'No pending launches were found in this completed check. New launches may appear after this check.',
  failedHeading: 'Pending launches unavailable',
  failedLead:
    'The engine could not be read. Pending launches may still exist.',
  incompleteHeading: 'More launches may exist',
  incompleteLead:
    'This check could not cover every launch. More launches may exist.',
  waitingHeading: 'Waiting for resources',
  preparingHeading: 'Preparing',
  preparingLead:
    'Harflow is preparing this launch. A running task has not been confirmed yet.',
  preparingHandshakeHeading: 'Preparing · Stop unavailable',
  preparingHandshakeLead:
    'This engine cannot stop this preparation yet. Stop becomes available after Harflow confirms the task has started.',
  grantedHeading: 'Launch granted',
  grantedLead:
    'The engine granted this launch. Harflow has not confirmed a running task yet.',
  notStartedHeading: 'Did not start',
  unavailableHeading: 'Launch status unavailable',
  unavailableLead:
    'Harflow could not check this launch. Its outcome is unknown.',
  missingHeading: 'Launch not found',
  missingLead:
    'This ID was not found in the latest check. It may have started or changed elsewhere. Its outcome is unknown.',
  recordedHeading: 'Task record found',
  recordedLead: 'Harflow found a task with this ID. Check its status to open it.',
  handoffFailedHeading: 'Task status unavailable',
  handoffFailedLead:
    'Harflow found a task, but could not check its status. Task controls remain unavailable.',
  stopConfirmHeading: 'Stop this launch?',
  stopConfirmLead:
    'This asks the engine to stop the full launch ID below. If it starts before the request arrives, the task with this same ID may be stopped.',
  stopConfirmDetail:
    'This is best effort. Files already written remain in place. The engine may refuse Stop because of workflow controls or your access.',
  stopRequestedHeading: 'Stop requested',
  stopRequestedLead:
    'The request was accepted. This does not confirm that the launch or task stopped. Check its status again.',
  stopUncertainHeading: 'Stop outcome unknown',
  stopUncertainLead:
    'The Stop response could not be confirmed. The launch or task may still be active. Check its state before taking another action.',
  stopRefusedHeading: 'Stop refused',
  stopRefusedLead:
    'The workflow controls this launch, so the engine refused Stop. The launch or task may still be active.',
  stopAvailabilityNote:
    'The engine may refuse Stop if this launch is controlled by a workflow or your access does not allow it.',
  unconfirmedStopNote:
    'Harflow will not send Stop again automatically. A missing launch or an unavailable status does not confirm that it stopped.',
  detailNote:
    'Harflow has not confirmed a running task yet. Messages and activity remain unavailable.',
  stopSheetWaitingNote:
    'Harflow has not confirmed a running task yet.',
  composerPlaceholder:
    'Messages are unavailable until Harflow confirms the task has started',
  composerCaption: 'Pending launch · messaging unavailable',
  badge: 'Pending launch',
  checkAgain: 'Check again',
  checkNextPage: 'Check next page',
  checkTaskStatus: 'Check task status',
  stop: 'Stop…',
  cancel: 'Cancel',
  requestStop: 'Request Stop',
  requestStopUnavailable:
    'Unavailable. Request Stop does not run in this mock.',
  checkAgainUnavailable:
    'Unavailable. Check again does not invent a new read in this mock.',
  checkNextUnavailable:
    'Unavailable. Check next page does not invent a new read in this mock.',
  checkTaskUnavailable:
    'Unavailable. Task status is not opened from this mock handoff.',
  neutralTitle: 'Pending launch',
} as const

export function waitingLead(resourcesText: string): string {
  return `Waiting for ${resourcesText}. Harflow has not confirmed a running task yet.`
}

export function notStartedLead(reason: string): string {
  return `The engine recorded that this launch did not start. Reason: ${reason}.`
}
