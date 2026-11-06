import { describe, expect, it } from 'vitest'
import {
  harnessInstallLabel,
  harnessQualificationLabel,
  harnessRegistrationLabel,
} from '../../model'
import {
  divergentHarnessesObservation,
  populatedHarnessesObservation,
} from './harnessFixtures'

describe('harness fixtures', () => {
  it('keeps specimen install, registration, and qualification independent', () => {
    const rows = populatedHarnessesObservation().harnesses
    const claude = rows.find((row) => row.id === 'claude-code')
    const antigravity = rows.find((row) => row.id === 'antigravity')
    expect(claude?.install.kind).toBe('installed')
    expect(claude?.registration.kind).toBe('registered')
    expect(claude?.qualification.kind).toBe('ready')
    expect(antigravity?.install).toEqual({
      kind: 'not-found',
      label: 'Not found on PATH',
    })
    expect(antigravity?.registration.kind).toBe('unknown')
    expect(antigravity?.qualification.kind).toBe('not-qualified')
    expect(harnessRegistrationLabel({ kind: 'unknown' })).toBe(
      'Registration unknown',
    )
    expect(harnessRegistrationLabel({ kind: 'unknown' })).not.toBe(
      'Not registered',
    )
    expect(harnessInstallLabel({ kind: 'unknown' })).toBe('Unknown')
    expect(harnessQualificationLabel({ kind: 'unknown' })).toBe('Unknown')
    expect(harnessQualificationLabel({ kind: 'unknown' })).not.toBe('Ready')
    expect(claude?.approvals).toEqual({
      kind: 'listed',
      entries: ['harflow/*', 'github/create_pull_request', 'linear/get_issue'],
    })
    expect(rows.find((row) => row.id === 'codex')?.approvals).toBeNull()
    expect(antigravity?.approvals).toBeNull()
  })

  it('includes installed-unregistered and unknown-install qualified rows', () => {
    const rows = divergentHarnessesObservation().harnesses
    const installedOnly = rows.find((row) => row.id === 'installed-only')
    const qualified = rows.find((row) => row.id === 'registered-qualified')
    expect(installedOnly?.install.kind).toBe('installed')
    expect(installedOnly?.registration.kind).toBe('not-registered')
    expect(installedOnly?.qualification.kind).toBe('unknown')
    expect(qualified?.install.kind).toBe('unknown')
    expect(qualified?.registration.kind).toBe('registered')
    expect(qualified?.qualification).toEqual({
      kind: 'ready',
      label: 'Ready',
    })
    expect(divergentHarnessesObservation().server.kind).toBe('unknown')
    expect(installedOnly?.approvals).toEqual({ kind: 'unknown' })
    expect(qualified?.approvals).toEqual({
      kind: 'listed',
      entries: ['fixture/only-this-harness'],
    })
  })
})
