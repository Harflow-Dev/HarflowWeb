/** Approved M05 strings — HarflowDesign 6e31cd7 m05-proposal.js */

export const TASK_COMPOSER = {
  placeholderDefault: 'Queue a message…',
  hintDefault: 'Send queues. Send now requests delivery when safe.',
  placeholderPending:
    'Messages are available once this task starts',
  placeholderLockedUnknown: 'Locked until the new session is checked',
  placeholderLockedTakenOver:
    'Messages are off — you took this task over in Terminal',
  placeholderLockedStarting: 'Starting a new session…',
  placeholderLockedUnavailable: 'Unavailable until status can be read',
  stopLabel: 'Stop',
  stoppingLabel: 'Stopping…',
} as const

export const TASK_NOTICES = {
  stopping: {
    tone: 'info' as const,
    title: 'Stop requested',
    body: 'This run has not exited yet. The status changes when Harflow records the outcome.',
  },
  settling: {
    tone: 'info' as const,
    title: 'Settling',
    body: 'The run finished. Its last events and stored changes may still arrive.',
  },
  continued: {
    tone: 'info' as const,
    title: 'New session accepted',
    body: 'The engine accepted the request. It may still be waiting for resources; acceptance does not mean completion.',
  },
  reconstructed: {
    tone: 'warning' as const,
    title: 'Reconstructed outcome',
    body: "Harflow did not see this process exit. Done comes from the run's own closing output.",
  },
  statusUnavailable: {
    tone: 'warning' as const,
    title: 'Current status unavailable',
    body: 'The engine did not answer. Everything below was read earlier and may be out of date.',
    actionLabel: 'Retry read',
  },
} as const

/** Pending task body (Design m05-proposal.js task empty + pending head). */
export const TASK_PENDING_BODY = {
  requestDeferred: 'Original request is readable once this task starts.',
  emptyActivity: 'No activity yet. This task has not started.',
} as const

/** Pending resource-wait card (Design m05-proposal.js `resourceCard('queued')`). */
export const TASK_RESOURCE_WAIT = {
  title: 'Waiting for resources',
  detail: 'This task has no record yet and has not started.',
  note: 'The engine reports launch state only here. Slot details are on the Resources screen.',
  linkLabel: 'Open resource slots',
} as const

/** Held capacity card (Design `resourceCard('held')`). Title is filled with the name. */
export const TASK_RESOURCE_HELD = {
  detail: 'Capacity remains reserved for this task.',
  linkLabel: 'Open resource slots',
} as const

export const TASK_CONTINUE_LABEL = 'Continue in a new session'

export const TASK_BANNER_CAPTION = {
  failedContinue:
    'A new session starts from the stored request, summary and outcome. It can repeat work already done. Files are not rolled back.',
  launchUnknown:
    'Reads recorded successors only. A task still waiting for resources does not appear until it starts.',
  unknownFailedContinue:
    'Continue needs an observed exit and fully read output, which this run does not have.',
} as const

export const TASK_BANNER_COPY = {
  failedHarnessExit: 'Task failed: the harness exited with code 1',
  timedOutTitle: 'This run stopped at its turn limit',
  timedOutBody:
    'Timed out here means the limit on turns, not a clock. Files already written stay in place.',
  cancelledTitle: 'Cancelled',
  cancelledBody:
    'Files already written stay in place. Harflow did not undo anything.',
  unknownFailedTitle: 'Outcome inferred, not observed',
  unknownFailedBody:
    'Harflow never saw this process exit and found no result in its output, so it reports failed. Nothing it had already written was undone.',
  ownerLostTitle: 'The process watching this run is gone',
  ownerLostBody:
    'Captured output has stopped and no later summary is promised. The run itself may still be working. Check its changes or stop it before starting a replacement.',
  unverifiedTitle: "Harflow can't confirm this run",
  unverifiedBody:
    "It can't tell whether the process watching this run is alive. Output may or may not still be captured, and a later summary is unknown. Check status again before starting a replacement.",
  launchUnknownTitle: 'A new session may have started',
  launchUnknownBody:
    "The engine did not report back after Continue, so a task may exist. Don't resend yet.",
  launchUnknownAction: 'Check for a new task',
} as const