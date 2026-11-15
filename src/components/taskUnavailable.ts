/** Shared unavailable explanations for M05 task-screen commands (mock only). */

export {
  TASK_COPY_RESUME_UNAVAILABLE_EXPLANATION,
  TASK_COPY_RESUME_UNAVAILABLE_ID,
  TASK_OPEN_FINDER_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_FINDER_UNAVAILABLE_ID,
  TASK_OPEN_TERMINAL_UNAVAILABLE_EXPLANATION,
  TASK_OPEN_TERMINAL_UNAVAILABLE_ID,
  TASK_STOP_CONFIRM_UNAVAILABLE_EXPLANATION,
  TASK_STOP_CONFIRM_UNAVAILABLE_ID,
  TASK_TAKEOVER_CONFIRM_UNAVAILABLE_EXPLANATION,
  TASK_TAKEOVER_CONFIRM_UNAVAILABLE_ID,
} from '../presentation/taskOverflowCopy'

export const TASK_STOP_UNAVAILABLE_ID = 'task-stop-unavailable'
export const TASK_STOP_UNAVAILABLE_EXPLANATION =
  'Unavailable. Stop does not cancel the task in this mock.'

export const TASK_CONTINUE_UNAVAILABLE_ID = 'task-continue-unavailable'
export const TASK_CONTINUE_UNAVAILABLE_EXPLANATION =
  'Unavailable. Continue in a new session does not launch in this mock.'

export const TASK_CHECK_NEW_TASK_UNAVAILABLE_ID =
  'task-check-new-task-unavailable'
export const TASK_CHECK_NEW_TASK_UNAVAILABLE_EXPLANATION =
  'Unavailable. Check for a new task does not read successors in this mock.'

export const TASK_RETRY_READ_UNAVAILABLE_ID = 'task-retry-read-unavailable'
export const TASK_RETRY_READ_UNAVAILABLE_EXPLANATION =
  'Unavailable. Retry read does not invent a new status read in this mock.'

export const TASK_REFRESH_UNAVAILABLE_ID = 'task-refresh-unavailable'
export const TASK_REFRESH_UNAVAILABLE_EXPLANATION =
  'Unavailable. Refresh does not invent a new status read in this mock.'

export const TASK_OPEN_EVENTS_UNAVAILABLE_ID = 'task-open-events-unavailable'
export const TASK_OPEN_EVENTS_UNAVAILABLE_EXPLANATION =
  'Unavailable. Open Events does not change the pane in this mock.'

export const TASK_ARTIFACTS_UNAVAILABLE_ID = 'task-artifacts-unavailable'
export const TASK_ARTIFACTS_UNAVAILABLE_EXPLANATION =
  'Unavailable. Artifacts does not open in this mock.'

export const TASK_BANNER_ACTION_UNAVAILABLE_ID =
  'task-banner-action-unavailable'
export const TASK_BANNER_ACTION_UNAVAILABLE_EXPLANATION =
  'Unavailable. This task command does not run in this mock.'

export const TASK_COPY_REQUEST_UNAVAILABLE_ID = 'task-copy-request-unavailable'
export const TASK_COPY_REQUEST_UNAVAILABLE_EXPLANATION =
  'Unavailable. Copy original request does not copy in this mock.'

export const TASK_OPEN_SLOTS_UNAVAILABLE_ID = 'task-open-slots-unavailable'
export const TASK_OPEN_SLOTS_UNAVAILABLE_EXPLANATION =
  'Unavailable. Open resource slots does not navigate in this mock.'

export const TASK_BANNER_CAPTION_ID = 'task-banner-caption'
