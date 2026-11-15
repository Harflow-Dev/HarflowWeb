/** Verbatim engine attribution — always visible when a repository is drawn. */
export const CHANGES_ATTRIBUTION =
  'Observed repository differences; not evidence of task authorship.'

export const WORKING_TREE_NOTE =
  "Includes other writers' and pre-existing changes in this checkout."

export const WORKING_TREE_DIRTY_EXTRA =
  ' It was already dirty when this task started.'

export function workingTreeCaption(
  baselineDirty: boolean | 'unknown',
): string {
  return baselineDirty === true
    ? WORKING_TREE_NOTE + WORKING_TREE_DIRTY_EXTRA
    : WORKING_TREE_NOTE
}

export const ZERO_COMPLETE_CAPTION =
  'Complete capture: every page read, no scope limited, conflicts examined. This describes the repository, not what the agent did.'

export const MULTI_TAB_CAPTION =
  'The tab counts rows across repositories and scopes. A path in both scopes counts twice.'

export const SAME_PATH_CAPTION =
  'Counts and patch for this scope are separate observations and can differ.'

export const UNMERGED_CAPTION =
  "Reported conflicts are advisory names from the agent's index. They never add, change or hide a row."

export const TURNS_CAPTION =
  'Each turn is its own task with its own capture. Turns are not added together.'

export const RUNNING_NOTE = {
  title: 'No changes to show while this runs',
  body: 'Harflow captures repository differences once, after the task settles.',
  caption: 'Edits the agent reports appear in the transcript. They are not this capture.',
} as const

export const SETTLING_NOTE = {
  title: "Stored changes aren't available yet",
  body: 'Capture may still be settling. This view checks again.',
} as const

export const NOT_STARTED_NOTE = {
  title: 'Available once this task starts',
  body: 'A task waiting to launch has no record to read yet.',
} as const

export const NOT_OBSERVED_NOTE = {
  title: 'Changes not captured',
  body: "Harflow never observed this run's outcome, so it did not capture repository differences. The repository may still have changed.",
} as const

export const NO_REPOSITORY_NOTE = {
  title: 'No repository recorded',
  body: 'This task finished without a repository to compare.',
} as const

export const LOADING_NOTE = {
  title: 'Reading stored changes',
} as const

export const ENGINE_UNAVAILABLE_NOTE = {
  title: 'Changes unavailable',
  body: 'The engine did not answer. No changes are implied.',
} as const

const DOCUMENT_UNAVAILABLE_TITLE = 'Stored changes unavailable'
const HISTORY_UNAFFECTED = 'Other task history is unaffected.'

/** Body text for an unavailable stored document, keyed by `capture.reason`. */
const DOCUMENT_UNAVAILABLE_BODIES: ReadonlyMap<string, string> = new Map([
  [
    'capture_too_large',
    `The stored capture is too large to read. ${HISTORY_UNAFFECTED}`,
  ],
  [
    'capture_error',
    `The capture failed when the task settled. ${HISTORY_UNAFFECTED}`,
  ],
  [
    'changes_document_invalid',
    `The stored capture failed validation. ${HISTORY_UNAFFECTED}`,
  ],
])

const DOCUMENT_UNAVAILABLE_FALLBACK = `The stored capture could not be read. ${HISTORY_UNAFFECTED}`

export function documentUnavailableNote(reason: string | null): {
  readonly title: string
  readonly body: string
} {
  return {
    title: DOCUMENT_UNAVAILABLE_TITLE,
    body:
      (reason !== null ? DOCUMENT_UNAVAILABLE_BODIES.get(reason) : undefined) ??
      DOCUMENT_UNAVAILABLE_FALLBACK,
  }
}

export const INCOMPLETE_NOTE = {
  title: 'Capture incomplete',
  body: 'Capture hit its 2-second limit. Rows read so far are shown, and more may exist.',
} as const

export const TEXT_LOADING_CAPTION =
  'Loading: the row stays selected and no text is implied.'

export const TEXT_REFUSAL_NOTE = {
  title: "This diff couldn't be read",
  body: 'The stored changes were replaced since this list loaded. Reload the list, then choose the row again.',
} as const

export const CONFLICTS_MAY_EXIST_NOTE = {
  title: 'Conflicts may exist',
  body: 'Conflict names could not be read from this checkout. The rows above are still the real diff.',
} as const

export const DOCUMENT_UNAVAILABLE_REASONS = [
  {
    code: 'capture_too_large',
    detail: 'Over the 8 MiB stored capture limit',
  },
  {
    code: 'capture_error',
    detail: 'Capture failed when the task settled',
  },
  {
    code: 'changes_document_invalid',
    detail: 'Stored capture failed validation',
  },
  {
    code: 'usage error on an older engine',
    detail: 'This engine does not support Changes',
  },
] as const

export const TASK_LEVEL_NOT_CAPTURED_REASON = {
  code: 'Task-level, no repositories',
  detail: 'Not captured · outcome never observed, or capture missing',
} as const

/** Task-level capture refusal with no repositories, keyed by `capture.reason`. */
export function taskLevelNotCapturedNote(reason: string | null): {
  readonly title: string
  readonly body: string
} {
  if (reason === 'outcome_unobserved') return NOT_OBSERVED_NOTE
  return {
    title: NOT_OBSERVED_NOTE.title,
    body: 'No stored capture was found for this task. The repository may still have changed.',
  }
}

const REPOSITORY_REASON_NOTES: ReadonlyMap<string, string> = new Map([
  [
    'alternates_present',
    'This repository uses alternates, which capture never accepts. Nothing about it was read.',
  ],
])

/** Caption for a repository that has no scopes, keyed by its reason. */
export function repositoryReasonNote(reason: string | null): string | null {
  return reason === null ? null : (REPOSITORY_REASON_NOTES.get(reason) ?? null)
}

const SCOPE_REASON_NOTES: ReadonlyMap<string, string> = new Map([
  [
    'git_dir_unverified',
    'Its Git directory could not be verified, so no command was given this work tree.',
  ],
])

/** Caption for a scope that was not captured, keyed by its reason. */
export function scopeReasonNote(reason: string | null): string | null {
  return reason === null ? null : (SCOPE_REASON_NOTES.get(reason) ?? null)
}

/** Zero rows in a scope whose conflicts were never examined. */
export const CLEAN_BILL_NOTE =
  'No rows in this scope. Conflicts were not examined, so this is not a clean bill.'

/** Zero rows in a scope that was examined. */
export const ZERO_SCOPE_NOTE = 'No differences observed.'
