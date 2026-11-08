import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

describe('Composer harness-open centered specimen', () => {
  it('shows unavailable harness selected, disabled, with qualification hint', () => {
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
          harnessMenuPhase="harness"
          qualificationHint="Choose a qualified harness and model."
          optionsOpen={false}
          optionsCustomized={false}
          effort={DEFAULT_EFFORT}
          turns={DEFAULT_TURNS}
          approvals={DEFAULT_APPROVALS}
          effortOptions={EFFORT_OPTIONS}
          permissionPreview={accessPermissionPreview(composer.selectedAccess)}
          startBlockedReason="Choose a qualified harness and model."
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

    expect(
      screen.getByRole('button', { name: /Unavailable harness/ }),
    ).toBeInTheDocument()
    const unavailable = screen.getByRole('menuitem', {
      name: /Unavailable harness/,
    })
    expect(unavailable).toBeDisabled()
    expect(
      screen.getByText('Choose a qualified harness and model.'),
    ).toBeInTheDocument()
    const start = screen.getByRole('button', { name: 'Start task' })
    expect(start).toBeDisabled()
    expect(start).toHaveAttribute(
      'title',
      'Choose a qualified harness and model.',
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCloseOptions).not.toHaveBeenCalled()
    expect(onOpenMenu).not.toHaveBeenCalled()
    expect(screen.getByRole('menu', { name: 'Harness and model' })).toBeInTheDocument()
  })
})
