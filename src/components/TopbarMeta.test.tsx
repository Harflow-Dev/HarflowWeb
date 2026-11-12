import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import appCss from '../styles/app.css?raw'
import { TopbarMeta } from './TopbarMeta'

afterEach(() => {
  cleanup()
})

describe('TopbarMeta structure', () => {
  it('renders the plain caption and the compact dot together', () => {
    const { container } = render(<TopbarMeta>Revision 7</TopbarMeta>)
    const full = container.querySelector('.hw-topbar-meta__full')
    expect(full).toHaveTextContent('Revision 7')
    expect(full).not.toHaveAttribute('tabindex')
    const note = screen.getByRole('note')
    expect(note).toHaveAttribute('tabindex', '0')
    expect(note.querySelector('.hw-topbar-meta__dot')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('exposes the text once, without a self-referencing label', () => {
    render(<TopbarMeta>Revision 7</TopbarMeta>)
    const note = screen.getByRole('note')
    expect(note).not.toHaveAttribute('aria-labelledby')
    expect(note).not.toHaveAttribute('aria-label')
    expect(note.textContent).toBe('Revision 7')
    expect(note.querySelectorAll('.hd-sr')).toHaveLength(1)
  })
})

describe('TopbarMeta width switching (stylesheet)', () => {
  // jsdom cannot evaluate container queries; assert the rules that decide the form.
  function containerBlock(): string {
    const start = appCss.indexOf('@container hd-main (max-width: 800px)')
    expect(start).toBeGreaterThan(-1)
    return appCss.slice(start)
  }

  it('shows the caption by default and the dot only in the narrow container', () => {
    const base = appCss.slice(0, appCss.indexOf('@container hd-main'))
    expect(base).toMatch(/\.hw-topbar-meta__compact \{\s*display: none;/)
    const narrow = containerBlock()
    expect(narrow).toMatch(/\.hw-topbar-meta__full \{\s*display: none;/)
    expect(narrow).toMatch(/\.hw-topbar-meta__compact \{\s*display: inline-flex;/)
  })

  it('uses one threshold with no JS width measurement', () => {
    const calls = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor() {
        calls()
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    })
    try {
      render(<TopbarMeta>Revision 7</TopbarMeta>)
      expect(calls).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('sizes lanes by class: 320 floor, 360 in the narrow container', () => {
    const base = appCss.slice(0, appCss.indexOf('@container hd-main'))
    expect(base).toMatch(/\.hd-lane \{\s*flex: 1 0 320px;\s*min-width: 320px;/)
    expect(containerBlock()).toMatch(
      /\.hd-lane \{\s*flex: 0 0 360px;\s*min-width: 360px;/,
    )
    expect(appCss).not.toMatch(/\.hw-preview__app--minimum \.hd-lane/)
  })
})

describe('TopbarMeta dismissal', () => {
  it('Escape on the focused dot dismisses and stops propagation', async () => {
    const user = userEvent.setup()
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    try {
      render(<TopbarMeta>Revision 7</TopbarMeta>)
      const note = screen.getByRole('note')
      await user.tab()
      await user.tab()
      note.focus()
      expect(note).toHaveFocus()
      expect(note).not.toHaveClass('is-dismissed')

      await user.keyboard('{Escape}')
      expect(note).toHaveClass('is-dismissed')
      expect(outer).not.toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Escape' }),
      )

      // Nothing left to dismiss: Escape passes through.
      await user.keyboard('{Escape}')
      expect(outer).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Escape' }),
      )
    } finally {
      document.removeEventListener('keydown', outer)
    }
  })

  it('does not consume Escape typed elsewhere', async () => {
    const user = userEvent.setup()
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    try {
      render(
        <>
          <TopbarMeta>Revision 7</TopbarMeta>
          <button type="button">Other</button>
        </>,
      )
      screen.getByRole('button', { name: 'Other' }).focus()
      await user.keyboard('{Escape}')
      expect(screen.getByRole('note')).not.toHaveClass('is-dismissed')
      expect(outer).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener('keydown', outer)
    }
  })

  it('refocus clears the dismissal', async () => {
    const user = userEvent.setup()
    render(<TopbarMeta>Revision 7</TopbarMeta>)
    const note = screen.getByRole('note')
    note.focus()
    await user.keyboard('{Escape}')
    expect(note).toHaveClass('is-dismissed')
    act(() => {
      note.blur()
      note.focus()
    })
    expect(note).not.toHaveClass('is-dismissed')
  })

  it('hover-only reveal dismisses on Escape and mouseenter clears it', () => {
    render(<TopbarMeta>Revision 7</TopbarMeta>)
    const note = screen.getByRole('note')
    fireEvent.mouseEnter(note)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(note).toHaveClass('is-dismissed')
    fireEvent.mouseLeave(note)
    fireEvent.mouseEnter(note)
    expect(note).not.toHaveClass('is-dismissed')
  })

  it('ignores Escape on the document when not hovered', () => {
    render(<TopbarMeta>Revision 7</TopbarMeta>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('note')).not.toHaveClass('is-dismissed')
  })
})
