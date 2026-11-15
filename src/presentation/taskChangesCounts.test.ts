import { describe, expect, it } from 'vitest'
import {
  errorDoc,
  incompleteDoc,
  multiDoc,
  multiLimitedDoc,
  noRepositoryDoc,
  notCapturedDoc,
  rowStatesDoc,
  runningCaptureDoc,
  samePathDoc,
  singleDoc,
  unmergedDoc,
  zeroDoc,
} from '../adapters/mock/taskChangesFixtureDocs'
import {
  QUEUE_PY_PATH,
  TASK_CHANGES_SAME_PATH_ID,
  TASK_CHANGES_SINGLE_ID,
} from '../adapters/mock/taskChangesFixtures'
import {
  contentState,
  row,
  scopeAvailable,
  scopeCustom,
} from '../adapters/mock/taskChangesFixtureBuilders'
import { asTaskId } from '../model'
import { workingTreeCaption, WORKING_TREE_DIRTY_EXTRA, WORKING_TREE_NOTE } from './taskChangesCopy'
import {
  changesCaptureIsComplete,
  changesShowsZeroCompleteCaption,
  changesTabCount,
  formatRepositoryCount,
  formatScopeCount,
  showsTaskLevelNotCapturedReasons,
} from './taskChangesCounts'
import {
  changesRowIsDisabled,
  changesRowStateLabel,
} from './taskChangesRowLabels'
import { repositoryTag, scopeTag } from './taskChangesTags'

const TASK = asTaskId('task-counts')

describe('changesTabCount', () => {
  it('sums stored row counts for a complete single-repository document', () => {
    expect(changesTabCount(singleDoc(TASK_CHANGES_SINGLE_ID))).toBe('4')
  })

  it('sums every repository and scope for the eight-repository document', () => {
    expect(changesTabCount(multiDoc(TASK))).toBe('128')
  })

  it('omits the number when any repository or scope is limited', () => {
    expect(changesTabCount(multiLimitedDoc(TASK))).toBeNull()
    expect(changesTabCount(incompleteDoc(TASK))).toBeNull()
    expect(changesTabCount(notCapturedDoc(TASK))).toBeNull()
    expect(changesTabCount(runningCaptureDoc(TASK))).toBeNull()
    expect(changesTabCount(errorDoc(TASK))).toBeNull()
    expect(changesTabCount(noRepositoryDoc(TASK))).toBeNull()
  })

  it('keeps a number when conflicts are unknown but every scope is available', () => {
    expect(changesTabCount(unmergedDoc(TASK))).toBe('3')
  })

  it('reports zero for a complete empty document', () => {
    expect(changesTabCount(zeroDoc(TASK))).toBe('0')
  })

  it('counts the same path in both scopes twice', () => {
    expect(changesTabCount(samePathDoc(TASK_CHANGES_SAME_PATH_ID))).toBe('3')
  })

  it('counts row-state rows including the working-tree directory', () => {
    expect(changesTabCount(rowStatesDoc(TASK))).toBe('9')
  })
})

describe('changesCaptureIsComplete', () => {
  it('is true only when every repository and scope is available and examined', () => {
    expect(changesCaptureIsComplete(singleDoc(TASK))).toBe(true)
    expect(changesCaptureIsComplete(multiDoc(TASK))).toBe(true)
    expect(changesCaptureIsComplete(zeroDoc(TASK))).toBe(true)
    expect(changesCaptureIsComplete(samePathDoc(TASK))).toBe(true)
    expect(changesCaptureIsComplete(unmergedDoc(TASK))).toBe(false)
    expect(changesCaptureIsComplete(incompleteDoc(TASK))).toBe(false)
    expect(changesCaptureIsComplete(notCapturedDoc(TASK))).toBe(false)
    expect(changesCaptureIsComplete(multiLimitedDoc(TASK))).toBe(false)
    expect(changesCaptureIsComplete(noRepositoryDoc(TASK))).toBe(false)
    expect(changesCaptureIsComplete(errorDoc(TASK))).toBe(false)
  })
})

describe('changesShowsZeroCompleteCaption', () => {
  it('is true only for a complete capture with zero rows', () => {
    expect(changesShowsZeroCompleteCaption(zeroDoc(TASK))).toBe(true)
    expect(changesShowsZeroCompleteCaption(singleDoc(TASK))).toBe(false)
    expect(changesShowsZeroCompleteCaption(incompleteDoc(TASK))).toBe(false)
    expect(changesShowsZeroCompleteCaption(noRepositoryDoc(TASK))).toBe(false)
  })
})

describe('same-path rows', () => {
  it('keeps the same path as two rows, one per scope', () => {
    const repo = samePathDoc(TASK_CHANGES_SAME_PATH_ID).repositories[0]!
    const committed = repo.scopes.committed_range?.rows.filter(
      (item) => item.path === QUEUE_PY_PATH,
    )
    const working = repo.scopes.working_tree?.rows.filter(
      (item) => item.path === QUEUE_PY_PATH,
    )
    expect(committed).toHaveLength(1)
    expect(working).toHaveLength(1)
    expect(repo.scopes.working_tree?.countsAndPatchSeparate).toBe(true)
  })
})

describe('formatScopeCount', () => {
  it('maps every scope state used in the G-DIFF documents', () => {
    expect(formatScopeCount(scopeAvailable({ rows: [], rowCount: 3 }))).toBe('3')
    expect(
      formatScopeCount(
        scopeAvailable({ rows: [], rowCount: 500, rowsTruncated: true }),
      ),
    ).toBe('500+')
    expect(
      formatScopeCount(
        scopeCustom({ state: 'incomplete', reason: 'capture_timeout', rowCount: 0 }),
      ),
    ).toBe('0+')
    expect(
      formatScopeCount(
        scopeCustom({ state: 'incomplete', reason: 'capture_timeout', rowCount: 1 }),
      ),
    ).toBe('1+')
    expect(
      formatScopeCount(
        scopeCustom({ state: 'not_captured', reason: 'git_dir_unverified', rowCount: 0 }),
      ),
    ).toBe('—')
  })
})

describe('formatRepositoryCount', () => {
  it('omits a number for not_captured and unavailable repositories', () => {
    const notCaptured = notCapturedDoc(TASK).repositories.find(
      (repo) => repo.name === 'vendored-tools',
    )!
    const unavailable = multiLimitedDoc(TASK).repositories.find(
      (repo) => repo.name === 'old-checkout',
    )!
    expect(formatRepositoryCount(notCaptured)).toBeNull()
    expect(formatRepositoryCount(unavailable)).toBeNull()
  })

  it('marks a truncated repository as limited', () => {
    const limited = multiLimitedDoc(TASK).repositories[0]!
    expect(formatRepositoryCount(limited)).toBe('500+')
  })
})

describe('showsTaskLevelNotCapturedReasons', () => {
  it('shows the task-level reasons list on the notCaptured specimen', () => {
    expect(showsTaskLevelNotCapturedReasons(notCapturedDoc(TASK))).toBe(true)
    expect(showsTaskLevelNotCapturedReasons(singleDoc(TASK))).toBe(false)
  })
})

describe('workingTreeCaption', () => {
  it('appends the dirty extra only when the baseline was dirty', () => {
    expect(workingTreeCaption(false)).toBe(WORKING_TREE_NOTE)
    expect(workingTreeCaption('unknown')).toBe(WORKING_TREE_NOTE)
    expect(workingTreeCaption(true)).toBe(
      WORKING_TREE_NOTE + WORKING_TREE_DIRTY_EXTRA,
    )
  })
})

describe('repository and scope tags', () => {
  it('maps repository states from the G-DIFF documents', () => {
    const limited = multiLimitedDoc(TASK)
    expect(repositoryTag(limited.repositories[0]!)).toEqual({
      label: 'Row limit',
      tone: 'warn',
    })
    expect(formatRepositoryCount(limited.repositories[0]!)).toBe('500+')
    expect(
      repositoryTag(limited.repositories.find((r) => r.name === 'site')!),
    ).toEqual({ label: 'Not started · budget used', tone: 'warn' })
    expect(
      repositoryTag(limited.repositories.find((r) => r.name === 'tools')!),
    ).toEqual({ label: 'Not captured', tone: 'warn' })
    expect(
      repositoryTag(
        limited.repositories.find((r) => r.name === 'old-checkout')!,
      ),
    ).toEqual({ label: 'Unavailable', tone: 'warn' })
    expect(repositoryTag(unmergedDoc(TASK).repositories[1]!)).toEqual({
      label: 'Reported conflict',
      tone: 'info',
    })
    expect(repositoryTag(unmergedDoc(TASK).repositories[0]!)).toEqual({
      label: 'Conflicts unknown',
      tone: 'warn',
    })
    expect(repositoryTag(notCapturedDoc(TASK).repositories[0]!)).toEqual({
      label: 'Working tree not captured',
      tone: 'warn',
    })
    expect(repositoryTag(notCapturedDoc(TASK).repositories[2]!)).toEqual({
      label: 'Identity changed',
      tone: 'warn',
    })
  })

  it('maps scope tags for not_captured, incomplete, and row-limit states', () => {
    const working = notCapturedDoc(TASK).repositories[0]!.scopes.working_tree!
    expect(scopeTag(working)).toEqual({ label: 'Not captured', tone: 'warn' })
    const incomplete = incompleteDoc(TASK).repositories[0]!.scopes.committed_range!
    expect(scopeTag(incomplete)).toEqual({
      label: 'Incomplete · time limit',
      tone: 'warn',
    })
    const truncated =
      multiLimitedDoc(TASK).repositories[0]!.scopes.committed_range!
    expect(scopeTag(truncated)).toEqual({
      label: 'Row limit · 500 of more',
      tone: 'warn',
    })
    expect(
      scopeTag(
        scopeCustom({
          state: 'available',
          reason: null,
          rowCount: 0,
          unmergedUnknown: true,
        }),
      ),
    ).toEqual({ label: 'Conflicts unknown', tone: 'warn' })
  })
})

describe('row content-state labels', () => {
  it('maps every row state drawn on the row-states document', () => {
    const committed = rowStatesDoc(TASK).repositories[0]!.scopes.committed_range!
    const labels = committed.rows.map((item) => changesRowStateLabel(item))
    expect(labels).toEqual([
      'Truncated · over 64 KiB',
      'Partial text · task limit',
      'Text omitted · task limit',
      'Binary',
      'Submodule · no text',
      'Unmerged · no text',
      'Path cut · no text',
      'Bytes, not UTF-8',
    ])
    expect(changesRowIsDisabled(committed.rows[6]!)).toBe(true)
    const working = rowStatesDoc(TASK).repositories[0]!.scopes.working_tree!
    expect(changesRowStateLabel(working.rows[0]!)).toBe('Directory · name only')
  })

  it('maps name-only untracked files and truncated capture-timeout rows', () => {
    expect(
      changesRowStateLabel(
        row({
          path: 'notes/retry-budget.md',
          status: 'untracked',
          additions: null,
          deletions: null,
          content: contentState('not_captured', 'untracked', null),
        }),
      ),
    ).toBe('name only')
    expect(
      changesRowStateLabel(
        row({
          path: 'big.txt',
          status: 'modified',
          additions: 1,
          deletions: 0,
          content: contentState('truncated', 'capture_timeout', null),
        }),
      ),
    ).toBe('Truncated · time limit')
  })
})
