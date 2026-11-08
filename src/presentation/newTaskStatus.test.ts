import { describe, expect, it } from 'vitest'
import { asHarnessId, asModelId, asRepositoryId, asTaskId } from '../model'
import { populatedComposer, populatedSidebar } from '../adapters/mock/fixtures'
import {
  DEFAULT_APPROVALS,
  DEFAULT_EFFORT,
  DEFAULT_TURNS,
} from './taskOptions'
import { newTaskStatusMessage } from './newTaskStatus'
import type { NewTaskScreenState } from './screenState'

function baseState(
  partial: Partial<NewTaskScreenState> = {},
): NewTaskScreenState {
  return {
    appearance: 'system',
    sidebarCollapsed: false,
    prompt: '',
    selectedRepositoryId: asRepositoryId('repo-mcp'),
    selectedHarnessId: asHarnessId('claude'),
    selectedModelId: asModelId('claude-sonnet-5'),
    selectedAccess: 'edit_repo',
    openMenu: null,
    harnessMenuPhase: 'harness',
    optionsOpen: false,
    effort: DEFAULT_EFFORT,
    turns: DEFAULT_TURNS,
    approvals: DEFAULT_APPROVALS,
    canSubmit: false,
    submission: { kind: 'idle' },
    context: {
      kind: 'ready',
      composer: populatedComposer(),
      sidebar: populatedSidebar(),
    },
    ...partial,
  }
}

describe('newTaskStatusMessage', () => {
  it('maps refused outcomes to code and reason', () => {
    expect(
      newTaskStatusMessage(
        baseState({
          prompt: 'Keep me',
          submission: {
            kind: 'refused',
            code: 'invalid_params',
            reason: 'fixture refusal',
          },
        }),
      ),
    ).toBe('Start was refused (invalid_params): fixture refusal')
  })

  it('shows qualification hint when observation is not ready', () => {
    expect(
      newTaskStatusMessage(
        baseState({
          prompt: 'Review the delivery queue',
          context: {
            kind: 'ready',
            composer: { ...populatedComposer(), qualification: 'checking' },
            sidebar: populatedSidebar(),
          },
        }),
      ),
    ).toBe('Choose a qualified harness and model.')
  })

  it('prefers a current options problem over a prior accepted outcome', () => {
    expect(
      newTaskStatusMessage(
        baseState({
          prompt: '',
          effort: 'unsupported',
          submission: { kind: 'accepted', taskId: asTaskId('t1') },
        }),
      ),
    ).toMatch(/effort/)
  })

  it('shows Task created only for an empty draft after accept with valid options', () => {
    expect(
      newTaskStatusMessage(
        baseState({
          prompt: '',
          submission: { kind: 'accepted', taskId: asTaskId('t1') },
        }),
      ),
    ).toBe('Task created.')
  })

  it('keeps pending and unknown ahead of validation copy', () => {
    expect(
      newTaskStatusMessage(
        baseState({
          effort: 'unsupported',
          submission: { kind: 'pending' },
        }),
      ),
    ).toBe('Starting task…')
    expect(
      newTaskStatusMessage(
        baseState({
          effort: 'unsupported',
          submission: {
            kind: 'unknown',
            message: 'fixture unknown',
          },
        }),
      ),
    ).toMatch(/outcome is unknown/)
  })
})
