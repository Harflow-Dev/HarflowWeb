import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { populatedComposer } from '../adapters/mock/fixtures'
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

type Override = {
  readonly prompt?: string
  readonly canSubmit?: boolean
  readonly locked?: boolean
  readonly optionsOpen?: boolean
  readonly effort?: typeof DEFAULT_EFFORT
  readonly turns?: string
  readonly onPrompt?: (value: string) => void
  readonly onToggleOptions?: () => void
  readonly onCloseOptions?: (focus: boolean) => void
  readonly onSubmit?: () => void
}

function composerProps(overrides: Override = {}) {
  const composer = populatedComposer()
  return {
    prompt: overrides.prompt ?? '',
    canSubmit: overrides.canSubmit ?? false,
    pending: false,
    locked: overrides.locked ?? false,
    repositories: composer.repositories,
    harnesses: composer.harnesses,
    accessOptions: composer.accessOptions,
    selectedRepositoryId: composer.selectedRepositoryId,
    selectedHarnessId: composer.selectedHarnessId,
    selectedModelId: composer.selectedModelId,
    selectedAccess: composer.selectedAccess,
    openMenu: null,
    qualificationHint: null,
    optionsOpen: overrides.optionsOpen ?? false,
    optionsCustomized:
      (overrides.effort ?? DEFAULT_EFFORT) !== DEFAULT_EFFORT ||
      (overrides.turns ?? DEFAULT_TURNS) !== DEFAULT_TURNS,
    effort: overrides.effort ?? DEFAULT_EFFORT,
    turns: overrides.turns ?? DEFAULT_TURNS,
    approvals: DEFAULT_APPROVALS,
    effortOptions: EFFORT_OPTIONS,
    permissionPreview: accessPermissionPreview(composer.selectedAccess),
    startBlockedReason: null,
    qualification: 'ready' as const,
    onPrompt: overrides.onPrompt ?? vi.fn(),
    onOpenMenu: vi.fn(),
    onSelectRepository: vi.fn(),
    onSelectHarness: vi.fn(),
    onSelectModel: vi.fn(),
    onSelectAccess: vi.fn(),
    onToggleOptions: overrides.onToggleOptions ?? vi.fn(),
    onCloseOptions: overrides.onCloseOptions ?? vi.fn(),
    onEffort: vi.fn(),
    onTurns: vi.fn(),
    onApprovals: vi.fn(),
    onSubmit: overrides.onSubmit ?? vi.fn(),
  }
}

function renderComposer(overrides: Override = {}) {
  const props = composerProps(overrides)
  const view = render(
    <div className="hw-compose-area" style={{ height: 600 }}>
      <Composer {...props} />
    </div>,
  )
  return { ...props, ...view }
}

describe('Composer', () => {
  it('starts the prompt at one visual line and grows with typed text', () => {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLTextAreaElement) {
        const lines = Math.max(1, this.value.split('\n').length)
        return lines * 22 + 4
      },
    })
    const base = composerProps()
    const { rerender } = render(
      <div className="hw-compose-area">
        <Composer {...base} />
      </div>,
    )
    const input = screen.getByLabelText('Task prompt')
    expect(input).toHaveAttribute('rows', '1')
    expect((input as HTMLTextAreaElement).style.height).toBe('26px')
    rerender(
      <div className="hw-compose-area">
        <Composer {...composerProps({ prompt: 'a\nb\nc\nd' })} />
      </div>,
    )
    const grown = screen.getByLabelText('Task prompt') as HTMLTextAreaElement
    expect(Number.parseFloat(grown.style.height)).toBeGreaterThan(26)
    expect(grown.style.overflowY).toBe('hidden')
    rerender(
      <div className="hw-compose-area">
        <Composer
          {...composerProps({ prompt: 'a\nb\nc\nd\ne\nf\ng\nh\ni' })}
        />
      </div>,
    )
    const capped = screen.getByLabelText('Task prompt') as HTMLTextAreaElement
    expect(Number.parseFloat(capped.style.height)).toBeLessThanOrEqual(136)
    expect(capped.style.overflowY).toBe('auto')
  })

  it('exposes the More task options control and opens the popover', () => {
    const { onToggleOptions } = renderComposer()
    const trigger = screen.getByRole('button', { name: 'More task options' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Default options')).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(onToggleOptions).toHaveBeenCalled()
  })

  it('shows Task options fields when open and a customized dot', () => {
    renderComposer({ optionsOpen: true, effort: 'high' })
    expect(screen.getByRole('group', { name: 'Task options' })).not.toHaveAttribute(
      'hidden',
    )
    expect(screen.getByText('Customized options')).toBeInTheDocument()
    expect(screen.getByDisplayValue('high')).toBeInTheDocument()
    expect(screen.getByLabelText('Effort')).toBeInTheDocument()
    expect(screen.getByLabelText('Turn limit')).toBeInTheDocument()
    expect(screen.getByLabelText('Approvals')).toBeInTheDocument()
  })

  it('closes the options popover on Escape and returns focus to +', () => {
    const onCloseOptions = vi.fn()
    renderComposer({ optionsOpen: true, onCloseOptions })
    const trigger = screen.getByRole('button', { name: 'More task options' })
    screen.getByLabelText('Effort').focus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCloseOptions).toHaveBeenCalledWith(true)
    expect(trigger).toHaveFocus()
  })

  it('closes options on outside click without moving focus to +', () => {
    const onCloseOptions = vi.fn()
    renderComposer({ optionsOpen: true, onCloseOptions })
    const trigger = screen.getByRole('button', { name: 'More task options' })
    const effort = screen.getByLabelText('Effort')
    effort.focus()
    expect(effort).toHaveFocus()
    fireEvent.mouseDown(document.body)
    expect(onCloseOptions).toHaveBeenCalledWith(false)
    expect(trigger).not.toHaveFocus()
  })

  it('moves focus to the first select when Task options open from the keyboard', () => {
    const { rerender } = render(
      <div className="hw-compose-area" style={{ height: 600 }}>
        <Composer {...composerProps({ optionsOpen: false })} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'More task options' }), {
      detail: 0,
    })
    rerender(
      <div className="hw-compose-area" style={{ height: 600 }}>
        <Composer {...composerProps({ optionsOpen: true })} />
      </div>,
    )
    expect(screen.getByLabelText('Effort')).toHaveFocus()
  })

  it('does not move focus when Task options open from a pointer click', () => {
    const { rerender } = render(
      <div className="hw-compose-area" style={{ height: 600 }}>
        <Composer {...composerProps({ optionsOpen: false })} />
      </div>,
    )
    const trigger = screen.getByRole('button', { name: 'More task options' })
    fireEvent.click(trigger, { detail: 1 })
    rerender(
      <div className="hw-compose-area" style={{ height: 600 }}>
        <Composer {...composerProps({ optionsOpen: true })} />
      </div>,
    )
    expect(screen.getByLabelText('Effort')).not.toHaveFocus()
  })

  it('starts on Enter, inserts a line on Shift+Enter, and ignores IME composition', () => {
    const onSubmit = vi.fn()
    const onPrompt = vi.fn()
    renderComposer({
      prompt: 'Ready draft',
      canSubmit: true,
      onSubmit,
      onPrompt,
    })
    const prompt = screen.getByLabelText('Task prompt')
    fireEvent.keyDown(prompt, { key: 'Enter', shiftKey: false })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(prompt, { key: 'Enter', shiftKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(prompt, { key: 'Enter', isComposing: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(prompt, { key: 'Enter', keyCode: 229 })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables repository, harness, and access pills while locked', () => {
    renderComposer({ locked: true })
    expect(screen.getByRole('button', { name: /HarflowMCP/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Claude ·/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Can edit/ })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'More task options' }),
    ).toBeDisabled()
  })
})
