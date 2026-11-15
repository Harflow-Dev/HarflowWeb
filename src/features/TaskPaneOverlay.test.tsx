import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  body,
  fireResize,
  installLayoutStubs,
  mountScenario,
  pane,
  removeLayoutStubs,
} from '../test/taskPaneKit'

beforeEach(installLayoutStubs)

afterEach(() => {
  cleanup()
  removeLayoutStubs()
  window.location.hash = ''
})

const OVERLAY_WIDTH = 1000 - 264
const SPLIT_WIDTH = 1280 - 264

function column(): Element {
  return document.querySelector('.hd-m05-column') as Element
}

async function openFromToggle(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Show right pane' }))
}

describe('overlay focus', () => {
  it('moves focus to the selected tab when the pane opens', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    expect(body()?.className).toContain('hd-m05-body--overlay')
    const selected = screen.getByRole('tab', { selected: true })
    expect(selected).toHaveAccessibleName('Events')
    expect(selected).toHaveFocus()
  })

  it('focuses the selected tab when the scenario opens straight into overlay', async () => {
    await mountScenario('pane-overlay', OVERLAY_WIDTH)
    expect(screen.getByRole('tab', { selected: true })).toHaveFocus()
  })

  it('sets inert on the column while open and removes it after close', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    expect(column()).not.toHaveAttribute('inert')
    await openFromToggle(user)
    expect(column()).toHaveAttribute('inert')
    await user.click(screen.getByRole('button', { name: 'Close right pane' }))
    expect(pane()).toBeNull()
    expect(column()).not.toHaveAttribute('inert')
  })
})

describe('overlay Escape', () => {
  it('closes the pane and returns focus to the toggle that opened it', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    expect(pane()).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(pane()).toBeNull()
    expect(column()).not.toHaveAttribute('inert')
    const toggle = screen.getByRole('button', { name: 'Show right pane' })
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('returns focus to the chip that opened the pane', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    const chip = screen.getByRole('button', {
      name: 'Can edit this repo. Show what was enforced.',
    })
    await user.click(chip)
    expect(pane()).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(pane()).toBeNull()
    expect(chip).toHaveFocus()
  })

  it('returns focus to the toggle when the pane is closed with its Close button', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    await user.click(screen.getByRole('button', { name: 'Close right pane' }))
    expect(screen.getByRole('button', { name: 'Show right pane' })).toHaveFocus()
  })

  it('falls back to the toggle when the pane was already open on mount', async () => {
    await mountScenario('pane-overlay', OVERLAY_WIDTH)
    expect(pane()).not.toBeNull()
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(pane()).toBeNull()
    expect(screen.getByRole('button', { name: 'Show right pane' })).toHaveFocus()
  })

  it('does nothing when the keydown is already defaultPrevented', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    const prevent = (event: KeyboardEvent) => event.preventDefault()
    document.addEventListener('keydown', prevent, { capture: true })
    try {
      await user.keyboard('{Escape}')
    } finally {
      document.removeEventListener('keydown', prevent, { capture: true })
    }
    expect(pane()).not.toBeNull()
    expect(column()).toHaveAttribute('inert')
  })

  it('ignores other keys', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    await user.keyboard('{Enter}')
    expect(pane()).not.toBeNull()
  })

  it('does not listen for Escape in split mode', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', SPLIT_WIDTH)
    await openFromToggle(user)
    expect(body()?.className).toContain('hd-m05-body--split')
    await user.keyboard('{Escape}')
    expect(pane()).not.toBeNull()
  })
})

describe('overlay Escape while another surface owns it', () => {
  async function openMore(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'More actions' }))
  }

  it('closes only the More menu and keeps the pane open', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    await openMore(user)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(pane()).not.toBeNull()
    expect(column()).toHaveAttribute('inert')
    await user.keyboard('{Escape}')
    expect(pane()).toBeNull()
  })

  it('closes only the stop dialog and keeps the pane open', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', OVERLAY_WIDTH)
    await openFromToggle(user)
    await openMore(user)
    await user.click(screen.getByRole('menuitem', { name: /Stop task/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(pane()).not.toBeNull()
    expect(column()).toHaveAttribute('inert')
  })
})

describe('resize across the split threshold', () => {
  it('switches an open pane to overlay and back', async () => {
    await mountScenario('transcript-observed/events', SPLIT_WIDTH)
    expect(body()?.className).toContain('hd-m05-body--split')
    expect(column()).not.toHaveAttribute('inert')
    await fireResize(OVERLAY_WIDTH)
    expect(body()?.className).toContain('hd-m05-body--overlay')
    expect(column()).toHaveAttribute('inert')
    await fireResize(SPLIT_WIDTH)
    expect(body()?.className).toContain('hd-m05-body--split')
    expect(column()).not.toHaveAttribute('inert')
  })
})
