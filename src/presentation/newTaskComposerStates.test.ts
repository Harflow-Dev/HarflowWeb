import { describe, expect, it } from 'vitest'
import {
  checkingComposer,
  populatedComposer,
  unavailableHarnessComposer,
  unqualifiedComposer,
} from '../adapters/mock/fixtures'
import { asHarnessId, asModelId, asRepositoryId, asTaskId } from '../model'
import {
  DEFAULT_APPROVALS,
  DEFAULT_EFFORT,
  DEFAULT_TURNS,
} from './taskOptions'
import { withNewTaskCanSubmit } from './newTaskCanSubmit'
import {
  newTaskQualificationHint,
  newTaskStatusMessage,
} from './newTaskStatus'
import type { NewTaskScreenState } from './screenState'

function base(
  partial: Partial<NewTaskScreenState> = {},
): NewTaskScreenState {
  const composer = populatedComposer()
  return withNewTaskCanSubmit(
    {
      appearance: 'system',
      sidebarCollapsed: false,
      prompt: 'Review the delivery queue',
      selectedRepositoryId: composer.selectedRepositoryId,
      selectedHarnessId: composer.selectedHarnessId,
      selectedModelId: composer.selectedModelId,
      selectedAccess: composer.selectedAccess,
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
        composer,
        sidebar: {
          needsYouCount: 0,
          coverageIncomplete: false,
          coverageNote: null,
          running: [],
          recent: [],
        },
      },
    },
    partial,
  )
}

describe('centered composer observation states', () => {
  it('empty: describe-task copy and Start disabled', () => {
    const state = base({ prompt: '' })
    expect(newTaskStatusMessage(state)).toBe('Describe a task to continue.')
    expect(state.canSubmit).toBe(false)
  })

  it('loading: checking qualification gates Start with drawn explanation', () => {
    const state = base({
      context: {
        kind: 'ready',
        composer: checkingComposer(),
        sidebar: {
          needsYouCount: 0,
          coverageIncomplete: false,
          coverageNote: null,
          running: [],
          recent: [],
        },
      },
    })
    expect(newTaskStatusMessage(state)).toBe(
      'Choose a qualified harness and model.',
    )
    expect(newTaskQualificationHint(state)).toBe(
      'Choose a qualified harness and model.',
    )
    expect(state.canSubmit).toBe(false)
  })

  it('unqualified: same explanation and disabled Start', () => {
    const state = base({
      context: {
        kind: 'ready',
        composer: unqualifiedComposer(),
        sidebar: {
          needsYouCount: 0,
          coverageIncomplete: false,
          coverageNote: null,
          running: [],
          recent: [],
        },
      },
    })
    expect(newTaskStatusMessage(state)).toBe(
      'Choose a qualified harness and model.',
    )
    expect(state.canSubmit).toBe(false)
  })

  it('invalid: turns validation outranks ready copy and blocks Start', () => {
    const state = base({ turns: '0', optionsOpen: true })
    expect(newTaskStatusMessage(state)).toMatch(/whole number above 0/)
    expect(state.canSubmit).toBe(false)
  })

  it('starting: pending copy locks Start; no second submit path', () => {
    const state = base({ submission: { kind: 'pending' } })
    expect(newTaskStatusMessage(state)).toBe('Starting task…')
    expect(state.canSubmit).toBe(false)
  })

  it('refused: maps code and reason and keeps the draft', () => {
    const state = base({
      prompt: 'Keep refused draft',
      submission: {
        kind: 'refused',
        code: 'invalid_params',
        reason: 'fixture refusal',
      },
    })
    expect(newTaskStatusMessage(state)).toBe(
      'Start was refused (invalid_params): fixture refusal',
    )
    expect(state.prompt).toBe('Keep refused draft')
    expect(state.canSubmit).toBe(true)
  })

  it('options-closed: customized effort with options collapsed stays submittable', () => {
    const state = base({ effort: 'high', optionsOpen: false })
    expect(state.optionsOpen).toBe(false)
    expect(state.effort).toBe('high')
    expect(newTaskStatusMessage(state)).toMatch(/^Ready to start/)
    expect(state.canSubmit).toBe(true)
  })

  it('harness-open: unavailable selection stays selected and Start stays gated', () => {
    const composer = unavailableHarnessComposer()
    const state = base({
      selectedHarnessId: composer.selectedHarnessId,
      selectedModelId: composer.selectedModelId,
      selectedAccess: composer.selectedAccess,
      openMenu: 'harness',
      context: {
        kind: 'ready',
        composer,
        sidebar: {
          needsYouCount: 0,
          coverageIncomplete: false,
          coverageNote: null,
          running: [],
          recent: [],
        },
      },
    })
    expect(state.selectedHarnessId).toBe(asHarnessId('unavailable'))
    expect(state.openMenu).toBe('harness')
    expect(newTaskStatusMessage(state)).toBe(
      'Choose a qualified harness and model.',
    )
    expect(newTaskQualificationHint(state)).toBe(
      'Choose a qualified harness and model.',
    )
    expect(state.canSubmit).toBe(false)
    const unavailable = composer.harnesses.find(
      (h) => h.id === asHarnessId('unavailable'),
    )
    expect(unavailable?.available).toBe(false)
    expect(unavailable?.label).toBe('Unavailable harness')
  })

  it('accepted empty draft shows Task created', () => {
    const state = base({
      prompt: '',
      submission: { kind: 'accepted', taskId: asTaskId('t1') },
    })
    expect(newTaskStatusMessage(state)).toBe('Task created.')
  })

  it('ready empty repository selection is not submittable', () => {
    const state = base({
      selectedRepositoryId: null as unknown as ReturnType<typeof asRepositoryId>,
    })
    expect(state.canSubmit).toBe(false)
  })
})

describe('qualification vs model selection', () => {
  it('keeps an observation-selected unavailable harness id', () => {
    const composer = unavailableHarnessComposer()
    expect(composer.selectedHarnessId).toBe(asHarnessId('unavailable'))
    expect(composer.selectedModelId).toBe(asModelId('unavailable-default'))
    expect(composer.qualification).toBe('unqualified')
  })
})
