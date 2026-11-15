import type { TaskChangesContent, TaskChangesRowStatus } from '../model'

const STATUS_LETTER: Record<TaskChangesRowStatus, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  typechange: 'T',
  unmerged: 'U',
  submodule: 'S',
  untracked: '?',
  unknown: '·',
}

export function changesStatusLetter(status: TaskChangesRowStatus): string {
  return STATUS_LETTER[status]
}

/**
 * Content-state label drawn on the row, matching design rowStates / single.
 */
export function changesRowStateLabel(args: {
  readonly content: TaskChangesContent
  readonly pathTruncated: boolean
  readonly status: TaskChangesRowStatus
  readonly path: string
}): string | null {
  if (args.pathTruncated || args.content.reason === 'path_too_long') {
    return 'Path cut · no text'
  }
  const { state, reason } = args.content
  if (state === 'available') {
    if (args.status === 'untracked' && args.path.endsWith('/')) {
      return 'Directory · name only'
    }
    if (args.status === 'untracked' && reason === 'untracked') {
      return 'name only'
    }
    return null
  }
  if (state === 'binary') return 'Binary'
  if (state === 'truncated') {
    if (reason === 'file_limit') return 'Truncated · over 64 KiB'
    if (reason === 'task_limit') return 'Partial text · task limit'
    if (reason === 'capture_timeout') return 'Truncated · time limit'
    return 'Truncated'
  }
  if (state === 'omitted_size') return 'Text omitted · task limit'
  if (state === 'not_captured') {
    if (reason === 'submodule') return 'Submodule · no text'
    if (reason === 'unmerged') return 'Unmerged · no text'
    if (reason === 'untracked') {
      return args.path.endsWith('/') ? 'Directory · name only' : 'name only'
    }
    if (reason === 'bytes_not_utf8' || reason === 'not_utf8') {
      return 'Bytes, not UTF-8'
    }
    if (reason === 'path_too_long') return 'Path cut · no text'
    return null
  }
  return null
}

/** Rows that cannot open a diff stay disabled and dimmed. */
export function changesRowIsDisabled(args: {
  readonly content: TaskChangesContent
  readonly pathTruncated: boolean
}): boolean {
  if (args.pathTruncated) return true
  if (args.content.reason === 'path_too_long') return true
  return false
}
