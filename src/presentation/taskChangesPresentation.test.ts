import { describe, expect, it } from 'vitest'
import {
  bytesB64,
  committedScope,
  row,
  workingScope,
} from '../adapters/mock/taskChangesFixtureBuilders'
import {
  multiDoc,
  multiLimitedDoc,
  singleDoc,
  unmergedDoc,
  unobservedCaptureDoc,
  zeroDoc,
} from '../adapters/mock/taskChangesFixtureDocs'
import { asTaskId, taskChangesEntryKey } from '../model'
import {
  documentUnavailableNote,
  repositoryReasonNote,
  scopeReasonNote,
  taskLevelNotCapturedNote,
} from './taskChangesCopy'
import {
  CHANGES_SUMMARY_LAYOUT_MIN_REPOSITORIES,
  changesCaptureIsComplete,
  changesRepositoryCountLabel,
  changesUsesSummaryLayout,
} from './taskChangesCounts'
import {
  formatObservedAt,
  repositoryDisplayName,
  shortTaskId,
} from './taskChangesFormat'
import { changesDisplayPath, changesRowKey } from './taskChangesPaths'
import { changesRowStateLabel } from './taskChangesRowLabels'
import {
  observationHasReportedConflict,
  repositoryHasReportedConflict,
} from './taskChangesScopes'
import { repositoryTag } from './taskChangesTags'

const TASK = asTaskId('task-presentation')

describe('summary layout', () => {
  it('starts at four repositories', () => {
    expect(CHANGES_SUMMARY_LAYOUT_MIN_REPOSITORIES).toBe(4)
    expect(changesUsesSummaryLayout(singleDoc(TASK))).toBe(false)
    expect(changesUsesSummaryLayout(unmergedDoc(TASK))).toBe(false)
    expect(changesUsesSummaryLayout(multiDoc(TASK))).toBe(true)
    expect(changesUsesSummaryLayout(multiLimitedDoc(TASK))).toBe(true)
    const three = {
      ...multiDoc(TASK),
      repositories: multiDoc(TASK).repositories.slice(0, 3),
    }
    expect(changesUsesSummaryLayout(three)).toBe(false)
    expect(
      changesUsesSummaryLayout({
        ...three,
        repositories: multiDoc(TASK).repositories.slice(0, 4),
      }),
    ).toBe(true)
  })
})

describe('repository count label', () => {
  it('is omitted when the complete-zero caption already says no differences', () => {
    const zero = zeroDoc(TASK)
    expect(changesRepositoryCountLabel(zero, zero.repositories[0]!)).toBeNull()
    const multi = multiDoc(TASK)
    const empty = multi.repositories.find(
      (repo) => repo.repositoryRoot === '~/Code/tools',
    )!
    // Collapsed zero counts in a populated capture stay.
    expect(changesRepositoryCountLabel(multi, empty)).toBe('0')
  })
})

describe('conflicts only on the working-tree scope', () => {
  it('reads reported conflicts from the working-tree scope names', () => {
    const web = unmergedDoc(TASK).repositories[1]!
    expect(repositoryHasReportedConflict(web)).toBe(true)
    expect(observationHasReportedConflict(unmergedDoc(TASK))).toBe(true)
    expect(observationHasReportedConflict(singleDoc(TASK))).toBe(false)
    expect(repositoryTag(web)).toEqual({ label: 'Reported conflict', tone: 'info' })
    expect(web.reason).toBeNull()
  })

  it('carries no conflict facts on the committed scope', () => {
    const committed = committedScope({ rows: [], rowCount: 0 })
    expect('unmergedUnknown' in committed).toBe(false)
    expect('reportedConflicts' in committed).toBe(false)
    expect(workingScope({}).reportedConflicts).toEqual({
      names: [],
      truncated: false,
    })
  })

  it('does not call a capture complete while more pages exist', () => {
    expect(changesCaptureIsComplete(zeroDoc(TASK))).toBe(true)
    expect(changesCaptureIsComplete({ ...zeroDoc(TASK), hasMore: true })).toBe(false)
  })
})

describe('paths', () => {
  it('escapes non-UTF-8 bytes in the display path and keeps UTF-8 intact', () => {
    const bytes = row({
      pathBytesB64: bytesB64('legacy/caf\xe9.txt'),
      status: 'modified',
    })
    expect(bytes.path).toBeNull()
    expect(changesDisplayPath(bytes)).toBe('legacy/caf\\xe9.txt')
    expect(changesRowKey(bytes)).toBe(`b64:${bytes.pathBytesB64}`)
    const utf8 = btoa(String.fromCharCode(...new TextEncoder().encode('日本語/é.md')))
    expect(changesDisplayPath({ path: null, pathBytesB64: utf8 })).toBe('日本語/é.md')
    expect(changesDisplayPath({ path: 'a/b.py', pathBytesB64: null })).toBe('a/b.py')
  })

  it('labels a bytes path while the content stays normal', () => {
    const bytes = row({
      pathBytesB64: bytesB64('legacy/caf\xe9.txt'),
      status: 'modified',
      additions: 1,
      deletions: 1,
    })
    expect(bytes.content.state).toBe('available')
    expect(changesRowStateLabel(bytes)).toBe('Bytes, not UTF-8')
  })

  it('keys entries by path or raw bytes', () => {
    const a = taskChangesEntryKey({
      repositoryRoot: 'r',
      scope: 'committed_range',
      path: 'x',
      pathBytesB64: null,
    })
    const b = taskChangesEntryKey({
      repositoryRoot: 'r',
      scope: 'committed_range',
      path: null,
      pathBytesB64: 'eA==',
    })
    expect(a).not.toBe(b)
  })
})

describe('format helpers', () => {
  it('derives a repository name from its root', () => {
    expect(repositoryDisplayName('~/Code/Harflow/HarflowWeb')).toBe('HarflowWeb')
    expect(repositoryDisplayName('/workspace/repo/')).toBe('repo')
  })

  it('shortens a task id to eight characters', () => {
    expect(shortTaskId('7be02d91-5a3c-4e8f-b1d6-0c42a9e73f58')).toBe('7be02d91')
  })

  it('formats an observed instant as Today or a calendar day', () => {
    const now = new Date(2026, 10, 15, 18, 0)
    expect(formatObservedAt(new Date(2026, 10, 15, 10, 42).toISOString(), now)).toBe(
      'Today 10:42',
    )
    expect(formatObservedAt(new Date(2026, 10, 14, 9, 5).toISOString(), now)).toBe(
      'Nov 14 09:05',
    )
    expect(formatObservedAt('not a date', now)).toBe('not a date')
  })
})

describe('reason-keyed copy', () => {
  it('maps an unavailable document by its capture reason', () => {
    expect(documentUnavailableNote('capture_too_large').body).toBe(
      'The stored capture is too large to read. Other task history is unaffected.',
    )
    expect(documentUnavailableNote('capture_error').body).toContain('failed')
    expect(documentUnavailableNote('changes_document_invalid').body).toContain(
      'validation',
    )
    expect(documentUnavailableNote(null).body).toContain('could not be read')
    // Prototype keys are not reasons.
    for (const key of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      expect(documentUnavailableNote(key).body).toContain('could not be read')
      expect(repositoryReasonNote(key)).toBeNull()
      expect(scopeReasonNote(key)).toBeNull()
    }
  })

  it('keys repository and scope captions by contract reason', () => {
    expect(repositoryReasonNote('alternates_present')).toContain('alternates')
    expect(repositoryReasonNote('repository_identity_changed')).toBeNull()
    expect(scopeReasonNote('git_dir_unverified')).toContain('Git directory')
    expect(scopeReasonNote(null)).toBeNull()
  })

  it('draws a not-observed note for a task-level refusal', () => {
    const doc = unobservedCaptureDoc(TASK)
    expect(doc.capture.state).toBe('not_captured')
    expect(taskLevelNotCapturedNote('outcome_unobserved').title).toBe(
      'Changes not captured',
    )
    expect(taskLevelNotCapturedNote('capture_missing').body).toContain(
      'No stored capture',
    )
  })
})
