/** Approved M05 Events tab copy — HarflowDesign 6e31cd7 EVENTS map. */

export const EVENTS_NOT_STARTED = {
  title: 'Available once this task starts',
  body: 'A task waiting to launch has no record to read yet.',
} as const

export const EVENTS_UNAVAILABLE = {
  title: 'Status and history unavailable',
  body: 'The engine did not answer. This does not mean the task failed.',
  action: 'Retry read',
} as const

export const EVENTS_HISTORY_UNAVAILABLE = {
  title: 'Captured history unavailable',
  body: 'The read could not be completed. This does not mean the task failed.',
  action: 'Retry history read',
} as const

export const EVENTS_PAGE_ERROR = {
  title: "Earlier records couldn't be read",
  body: 'Records below stay. Reloading starts again from the newest page.',
  action: 'Reload from newest',
} as const

export const EVENTS_EMPTY_ROWS = 'No rows in the available captured history'
export const EVENTS_EMPTY_CAPTION = 'An empty window does not qualify totals.'

export const EVENTS_ACTIVITY_HEADING = 'Captured activity facts'
export const EVENTS_ACTIVITY_COUNT = (n: number) => `${n} tool calls observed`
export const EVENTS_ACTIVITY_CAPTION =
  'Observed in available captured history; this does not prove complete execution capture.'

export const EVENTS_RECORDS_HEADING = 'Captured activity'
export const EVENTS_RECORDS_CAPTION =
  'Public normalized events · bounded record window'

export const EVENTS_RECOVERED_HEADING = 'Recovered transcript'
export const EVENTS_RECOVERED_CAPTION =
  'Separate recovery source. Not used for captured activity totals.'

export const EVENTS_BEGINNING =
  'Available captured history reached its beginning. Reading position retained.'
export const EVENTS_LOAD_EARLIER = 'Load earlier'

export const EVENTS_LOADING_ACTIVITY = 'Loading tool activity'
export const EVENTS_LOADING_HISTORY = 'Loading captured history'

export const EVENTS_FACTS_TASK = 'Task'
export const EVENTS_FACTS_ENFORCEMENT = 'What was enforced'
export const EVENTS_FACTS_NOTICES = 'Notices'
export const EVENTS_FACTS_CONTINUITY = 'Continuity'
export const EVENTS_NO_NOTICES = 'No notices.'
export const EVENTS_ENFORCEMENT_CAPTION =
  'Reported by the engine for this task. Each item is claimed only as far as it says.'
export const EVENTS_CONTINUITY_TEXT =
  'Harflow began observing this run again after its dispatcher restarted. Ownership of the run did not change.'
export const EVENTS_CONTINUITY_CAPTION =
  'Time shown is process start evidence, not when the restart happened.'

export const EVENTS_EXIT_NOT_OBSERVED = 'Not observed'
export const EVENTS_EXIT_DASH = '—'

export const EVENTS_ENFORCEMENT_LABELS = {
  requested: 'Requested',
  mechanism: 'Mechanism',
  osSandbox: 'OS sandbox',
  writesConfined: 'Writes confined',
  directCommitCommands: 'Direct commit commands',
  publishAttempts: 'Publish attempts',
  network: 'Network',
} as const

/** Requested freedom → the app's existing access labels (mock fixtures). */
export const EVENTS_FREEDOM_LABELS: Readonly<Record<string, string>> = {
  write_in_repo: 'Can edit this repo',
  read_only: 'Read-only',
  publish: 'Can publish',
  unrestricted: 'Full access',
}

export const EVENTS_YES = 'Yes'
export const EVENTS_NO = 'No'
export const EVENTS_DENIED = 'Denied'
export const EVENTS_ALLOWED = 'Allowed'
export const EVENTS_NOT_ENFORCED = 'Not enforced'
export const EVENTS_NOT_ALLOWED = 'Not allowed'

/** Record kind → title; unknown kinds are public stubs. */
export const EVENTS_KIND_LABELS: Readonly<Record<string, string>> = {
  task_started: 'Task started',
  assistant_delta: 'Assistant delta',
  assistant_text: 'Assistant text',
  tool_call: 'Tool call',
  tool_result: 'Tool result',
  usage: 'Usage',
  task_finished: 'Task finished',
}
export const EVENTS_RECORD_SUFFIX = ' · normalized record'
export const EVENTS_STUB_TITLE = 'Unsupported record · public stub'
