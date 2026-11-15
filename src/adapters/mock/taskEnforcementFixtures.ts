import type { TaskEnforcement } from '../../model'

/**
 * Enforcement block shared by mock tasks whose access level is edit_repo.
 * `mechanism` is engine free text; the specimen copy stands in for it.
 */
export const EDIT_REPO_ENFORCEMENT: TaskEnforcement = {
  recorded: true,
  freedom: 'write_in_repo',
  mechanism: 'Harness permission rules',
  osEnforced: false,
  writesConfined: false,
  localCommit: 'denied',
  publishAttemptsAllowed: false,
  networkAccess: 'not_controlled',
}

/** A record that predates persisted enforcement (contract `recorded: false`). */
export const UNRECORDED_ENFORCEMENT: TaskEnforcement = {
  recorded: false,
  freedom: 'write_in_repo',
  note: 'This run predates enforcement being persisted, so what actually applied to it cannot be restated.',
}
