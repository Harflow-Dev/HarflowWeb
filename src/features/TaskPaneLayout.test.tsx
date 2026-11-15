import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  body,
  installLayoutStubs,
  main,
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

const SPLIT_WIDTH = 1280 - 264
const OVERLAY_WIDTH = 1000 - 264

function inertAncestor(el: Element): Element | null {
  return el.closest('[inert]')
}

describe('Events pane at split width', () => {
  it('places the pane beside the column inside the split body', async () => {
    await mountScenario('transcript-observed/events', SPLIT_WIDTH)
    const split = document.querySelector('.hd-m05-body--split')
    expect(split).not.toBeNull()
    const column = split?.querySelector(':scope > .hd-m05-column')
    expect(column).not.toBeNull()
    const aside = pane()
    expect(aside).not.toBeNull()
    expect(aside?.parentElement).toBe(split)
    expect(column?.contains(aside)).toBe(false)
    expect(aside?.previousElementSibling).toBe(column)
  })

  it('keeps nothing inert and offers a Close control', async () => {
    await mountScenario('transcript-observed/events', SPLIT_WIDTH)
    expect(document.querySelector('.hd-m05-column')).not.toHaveAttribute('inert')
    expect(document.querySelector('[inert]')).toBeNull()
    expect(inertAncestor(pane() as Element)).toBeNull()
    expect(
      within(pane() as HTMLElement).getByRole('button', {
        name: 'Close right pane',
      }),
    ).toBeInTheDocument()
  })

  it('does not mark the body as overlay or nopane', async () => {
    await mountScenario('transcript-observed/events', SPLIT_WIDTH)
    expect(body()?.className).toContain('hd-m05-body--split')
    expect(body()?.className).not.toContain('--overlay')
    expect(body()?.className).not.toContain('--nopane')
  })
})

describe('Events pane at overlay width', () => {
  it('uses the overlay body and makes only the column inert', async () => {
    await mountScenario('transcript-observed/events', OVERLAY_WIDTH)
    expect(body()?.className).toContain('hd-m05-body--overlay')
    const column = document.querySelector('.hd-m05-column')
    expect(column).toHaveAttribute('inert')
    expect(document.querySelector('.hd-m05-bar')).not.toHaveAttribute('inert')
    expect(inertAncestor(document.querySelector('.hd-m05-bar') as Element)).toBeNull()
    expect(inertAncestor(pane() as Element)).toBeNull()
    expect(document.querySelectorAll('[inert]')).toHaveLength(1)
  })

  it('keeps the pane a sibling of the inert column with a Close button', async () => {
    await mountScenario('transcript-observed/events', OVERLAY_WIDTH)
    const column = document.querySelector('.hd-m05-column') as Element
    expect(column.contains(pane())).toBe(false)
    expect(pane()?.parentElement).toBe(column.parentElement)
    expect(
      within(pane() as HTMLElement).getByRole('button', {
        name: 'Close right pane',
      }),
    ).toBeInTheDocument()
  })

  it('keeps the top bar chips and toggle reachable', async () => {
    await mountScenario('transcript-observed/events', OVERLAY_WIDTH)
    expect(
      screen.getByRole('button', { name: 'Hide right pane' }),
    ).toBeEnabled()
    expect(main().querySelector('.hd-m05-bar')).not.toBeNull()
  })
})

describe('pane toggle aria-controls', () => {
  it('points at an existing element while open', async () => {
    await mountScenario('transcript-observed/events', SPLIT_WIDTH)
    const toggle = screen.getByRole('button', { name: 'Hide right pane' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const target = toggle.getAttribute('aria-controls')
    expect(target).toBe('task-details-pane')
    expect(document.getElementById(target as string)).not.toBeNull()
  })

  it('is absent while closed', async () => {
    await mountScenario('transcript-observed', SPLIT_WIDTH)
    const toggle = screen.getByRole('button', { name: 'Show right pane' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).not.toHaveAttribute('aria-controls')
    expect(pane()).toBeNull()
    expect(body()?.className).toContain('hd-m05-body--nopane')
  })

  it('appears when the pane opens and disappears when it closes', async () => {
    const user = userEvent.setup()
    await mountScenario('transcript-observed', SPLIT_WIDTH)
    await user.click(screen.getByRole('button', { name: 'Show right pane' }))
    const open = screen.getByRole('button', { name: 'Hide right pane' })
    expect(open).toHaveAttribute('aria-controls', 'task-details-pane')
    expect(pane()).not.toBeNull()
    await user.click(open)
    expect(
      screen.getByRole('button', { name: 'Show right pane' }),
    ).not.toHaveAttribute('aria-controls')
    expect(pane()).toBeNull()
  })
})

describe('transcript column identity', () => {
  it('does not remount the column when the pane opens or closes', async () => {
    const user = userEvent.setup()
    await mountScenario('transcript-observed', SPLIT_WIDTH)
    const before = document.querySelector('.hd-m05-column')
    expect(before).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Show right pane' }))
    expect(pane()).not.toBeNull()
    expect(document.querySelector('.hd-m05-column')).toBe(before)
    await user.click(screen.getByRole('button', { name: 'Hide right pane' }))
    expect(pane()).toBeNull()
    expect(document.querySelector('.hd-m05-column')).toBe(before)
  })

  it('does not remount the column when the pane opens in overlay mode', async () => {
    const user = userEvent.setup()
    await mountScenario('transcript-observed', OVERLAY_WIDTH)
    const before = document.querySelector('.hd-m05-column')
    await user.click(screen.getByRole('button', { name: 'Show right pane' }))
    expect(document.querySelector('.hd-m05-column')).toBe(before)
    expect(before).toHaveAttribute('inert')
  })
})
