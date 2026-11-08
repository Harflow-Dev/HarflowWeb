import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PillMenu } from './PillMenu'

afterEach(() => {
  cleanup()
})

describe('PillMenu trigger ARIA', () => {
  it('keeps menu semantics for the row-menu variant', () => {
    render(
      <PillMenu
        open
        label="Repository"
        icon="folder"
        menuLabel="Repository"
        onToggle={vi.fn()}
      >
        <button type="button" role="menuitem">
          Item
        </button>
      </PillMenu>,
    )
    const trigger = screen.getByRole('button', { name: /Repository/ })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(screen.getByRole('menu', { name: 'Repository' })).toBeInTheDocument()
  })

  it('uses disclosure semantics for the fields picker variant', () => {
    render(
      <PillMenu
        open
        label="Claude · Default"
        icon="harness"
        menuLabel="Harness and model"
        fields
        onToggle={vi.fn()}
      >
        <span>fields</span>
      </PillMenu>,
    )
    const trigger = screen.getByRole('button', { name: /Claude/ })
    expect(trigger).not.toHaveAttribute('aria-haspopup')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panelId = trigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = screen.getByRole('group', { name: 'Harness and model' })
    expect(panel).toHaveAttribute('id', panelId)
  })
})
