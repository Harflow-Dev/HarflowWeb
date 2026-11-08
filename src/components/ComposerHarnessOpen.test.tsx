import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { unavailableHarnessComposer } from '../adapters/mock/fixtures'
import {
  DEFAULT_APPROVALS,
  DEFAULT_EFFORT,
  DEFAULT_TURNS,
  EFFORT_OPTIONS,
  accessPermissionPreview,
} from '../presentation/taskOptions'
import { Composer } from './Composer'

afterEach(() => {
  cleanup()
})

function optionLabels(select: HTMLSelectElement): string[] {
  return [...select.options].map((option) => option.textContent ?? '')
}

describe('Composer harness-open centered specimen', () => {
  it('renders labelled selects, disabled unavailable, hint, and keeps Escape open', () => {
    const composer = unavailableHarnessComposer()
    const onCloseOptions = vi.fn()
    const onOpenMenu = vi.fn()
    render(
      <div className="hw-compose-area" style={{ height: 600 }}>
        <Composer
          prompt="Review the delivery queue"
          canSubmit={false}
          pending={false}
          locked={false}
          repositories={composer.repositories}
          harnesses={composer.harnesses}
          accessOptions={composer.accessOptions}
          selectedRepositoryId={composer.selectedRepositoryId}
          selectedHarnessId={composer.selectedHarnessId}
          selectedModelId={composer.selectedModelId}
          selectedAccess={composer.selectedAccess}
          openMenu="harness"
          qualificationHint="Choose a qualified harness and model."
          optionsOpen={false}
          optionsCustomized={false}
          effort={DEFAULT_EFFORT}
          turns={DEFAULT_TURNS}
          approvals={DEFAULT_APPROVALS}
          effortOptions={EFFORT_OPTIONS}
          permissionPreview={accessPermissionPreview(composer.selectedAccess)}
          startBlockedReason="Choose a qualified harness and model."
          qualification="unqualified"
          onPrompt={vi.fn()}
          onOpenMenu={onOpenMenu}
          onSelectRepository={vi.fn()}
          onSelectHarness={vi.fn()}
          onSelectModel={vi.fn()}
          onSelectAccess={vi.fn()}
          onToggleOptions={vi.fn()}
          onCloseOptions={onCloseOptions}
          onEffort={vi.fn()}
          onTurns={vi.fn()}
          onApprovals={vi.fn()}
          onSubmit={vi.fn()}
        />
      </div>,
    )

    const panel = screen.getByRole('group', { name: 'Harness and model' })
    const selects = within(panel).getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    const harness = selects[0] as HTMLSelectElement
    const model = selects[1] as HTMLSelectElement
    expect(harness).toHaveAccessibleName(/Harness/)
    expect(model).toHaveAccessibleName(/^Model$/)

    expect(optionLabels(harness)).toEqual([
      'Claude Code',
      'Codex',
      'Mistral Vibe',
      'Unavailable harness',
    ])
    expect(optionLabels(model)).toEqual([
      'Default',
      'Opus 5.5',
      'Sonnet 5.5',
    ])
    expect(harness).toHaveDisplayValue('Unavailable harness')
    expect(model).toHaveDisplayValue('Default')
    const unavailable = [...harness.options].find(
      (option) => option.textContent === 'Unavailable harness',
    )
    expect(unavailable?.disabled).toBe(true)
    expect(harness).toHaveAttribute(
      'aria-describedby',
      'm04-harness-hint',
    )
    expect(document.getElementById('m04-harness-hint')).toHaveTextContent(
      'Choose a qualified harness and model.',
    )

    const start = screen.getByRole('button', { name: 'Start task' })
    expect(start).toBeDisabled()
    expect(start).toHaveAttribute(
      'title',
      'Choose a qualified harness and model.',
    )
    expect(start).toHaveAttribute(
      'aria-description',
      'Choose a qualified harness and model.',
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCloseOptions).not.toHaveBeenCalled()
    expect(onOpenMenu).not.toHaveBeenCalled()
    expect(
      screen.getByRole('group', { name: 'Harness and model' }),
    ).toBeInTheDocument()
  })
})
