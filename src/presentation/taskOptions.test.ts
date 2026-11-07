import { describe, expect, it } from 'vitest'
import { asHarnessId } from '../model'
import {
  DEFAULT_APPROVALS,
  DEFAULT_EFFORT,
  DEFAULT_TURNS,
  taskOptionsCustomized,
  taskOptionsProblem,
} from './taskOptions'

describe('taskOptions', () => {
  it('treats the design defaults as not customized', () => {
    expect(
      taskOptionsCustomized(DEFAULT_EFFORT, DEFAULT_TURNS, DEFAULT_APPROVALS),
    ).toBe(false)
  })

  it('marks effort, turns, or approvals changes as customized', () => {
    expect(taskOptionsCustomized('high', DEFAULT_TURNS, DEFAULT_APPROVALS)).toBe(
      true,
    )
    expect(taskOptionsCustomized(DEFAULT_EFFORT, '', DEFAULT_APPROVALS)).toBe(
      true,
    )
    expect(
      taskOptionsCustomized(DEFAULT_EFFORT, DEFAULT_TURNS, 'caller'),
    ).toBe(true)
  })

  it('blocks unsupported effort and Vibe non-default effort', () => {
    expect(
      taskOptionsProblem({
        effort: 'unsupported',
        turns: DEFAULT_TURNS,
        approvals: DEFAULT_APPROVALS,
        harnessId: asHarnessId('claude'),
        access: 'edit_repo',
      }),
    ).toMatch(/effort/)
    expect(
      taskOptionsProblem({
        effort: 'high',
        turns: DEFAULT_TURNS,
        approvals: DEFAULT_APPROVALS,
        harnessId: asHarnessId('vibe'),
        access: 'edit_repo',
      }),
    ).toMatch(/effort/)
  })

  it('blocks Codex turn limits and invalid turn values', () => {
    expect(
      taskOptionsProblem({
        effort: DEFAULT_EFFORT,
        turns: '8',
        approvals: DEFAULT_APPROVALS,
        harnessId: asHarnessId('codex'),
        access: 'edit_repo',
      }),
    ).toMatch(/turn limit/)
    expect(
      taskOptionsProblem({
        effort: DEFAULT_EFFORT,
        turns: '0',
        approvals: DEFAULT_APPROVALS,
        harnessId: asHarnessId('claude'),
        access: 'edit_repo',
      }),
    ).toMatch(/whole number/)
  })

  it('blocks caller approvals that break the design rules', () => {
    expect(
      taskOptionsProblem({
        effort: DEFAULT_EFFORT,
        turns: DEFAULT_TURNS,
        approvals: 'caller',
        harnessId: asHarnessId('claude'),
        access: 'edit_repo',
      }),
    ).toMatch(/Caller approvals/)
    expect(
      taskOptionsProblem({
        effort: DEFAULT_EFFORT,
        turns: '',
        approvals: 'caller',
        harnessId: asHarnessId('claude'),
        access: 'edit_repo',
      }),
    ).toBe('')
  })
})
