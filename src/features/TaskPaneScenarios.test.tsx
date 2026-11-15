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

const WIDE = 1280 - 264
const MINIMUM = 1000 - 264

function selectedTab(): string {
  return screen.getByRole('tab', { selected: true }).textContent ?? ''
}

function meta(): NodeListOf<Element> {
  return main().querySelectorAll('.hw-m05-meta')
}

function expandedGroups(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLDetailsElement>('details.hd-m05-facts'),
  )
    .filter((el) => el.open)
    .map((el) => el.dataset.group ?? '')
}

describe('running and failed pane scenarios', () => {
  it('pane-running-closed: no pane, nopane body, meta shown', async () => {
    await mountScenario('pane-running-closed', WIDE)
    expect(pane()).toBeNull()
    expect(body()?.className).toContain('hd-m05-body--nopane')
    expect(screen.getByRole('button', { name: 'Show right pane' })).toBeVisible()
    expect(meta()).toHaveLength(1)
    expect(meta()[0]).toHaveTextContent('Claude · Opus 5.5 · HarflowMCP')
  })

  it('pane-running-open: Events selected in a split pane, one meta line', async () => {
    await mountScenario('pane-running-open', WIDE)
    expect(pane()).not.toBeNull()
    expect(body()?.className).toContain('hd-m05-body--split')
    expect(selectedTab()).toBe('Events')
    expect(meta()).toHaveLength(1)
    expect(meta()[0]).toHaveTextContent('Claude · Opus 5.5 · HarflowMCP')
  })

  it('pane-failed-closed: failed badge, no pane, meta shown', async () => {
    await mountScenario('pane-failed-closed', WIDE)
    expect(pane()).toBeNull()
    expect(body()?.className).toContain('hd-m05-body--nopane')
    expect(main().querySelector('.hd-badge--running')).toBeNull()
    expect(main().querySelector('.hd-badge')).not.toBeNull()
    expect(meta()).toHaveLength(1)
    expect(meta()[0]?.textContent?.length).toBeGreaterThan(0)
  })
})

describe('layout scenarios', () => {
  it('pane-split: Changes pane beside the column at wide width', async () => {
    await mountScenario('pane-split', WIDE)
    expect(body()?.className).toContain('hd-m05-body--split')
    expect(pane()).not.toBeNull()
    expect(selectedTab()).toContain('Changes')
    expect(document.querySelector('[inert]')).toBeNull()
  })

  it('pane-overlay: overlay pane with shield chip, toggle and More', async () => {
    await mountScenario('pane-overlay', MINIMUM)
    expect(body()?.className).toContain('hd-m05-body--overlay')
    expect(pane()).not.toBeNull()
    expect(selectedTab()).toContain('Changes')
    expect(document.querySelector('.hd-m05-column')).toHaveAttribute('inert')
    expect(
      screen.getByRole('button', {
        name: 'Can edit this repo. Show what was enforced.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide right pane' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument()
  })

  it('topbar-minimum: meta exists once and the pane stays closed', async () => {
    await mountScenario('topbar-minimum', MINIMUM)
    expect(pane()).toBeNull()
    expect(meta()).toHaveLength(1)
    expect(meta()[0]).toHaveTextContent('Claude · Opus 5.5 · HarflowMCP')
    expect(
      screen.getByRole('button', { name: 'Show 2 notices' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Observation resumed after a restart. Show details.',
      }),
    ).toBeInTheDocument()
  })
})

describe('loading-pane', () => {
  it('shows the busy column group and a pane with real tab names', async () => {
    await mountScenario('loading-pane', WIDE)
    const busy = screen.getByRole('group', { name: 'Loading Task' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    const aside = pane() as HTMLElement
    expect(aside).not.toBeNull()
    expect(busy.contains(aside)).toBe(false)
    const tabs = within(aside).getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs).toEqual(['Changes', 'Artifacts', 'Events'])
    expect(within(aside).getByRole('tab', { selected: true })).toHaveTextContent(
      'Events',
    )
    expect(
      within(aside).getByRole('button', { name: 'Close right pane' }),
    ).toBeInTheDocument()
  })

  it('has no headings or body copy inside the pane body', async () => {
    await mountScenario('loading-pane', WIDE)
    const aside = pane() as HTMLElement
    const paneBody = aside.querySelector('.hd-m05-panescroll') as HTMLElement
    expect(paneBody).not.toBeNull()
    expect(within(paneBody).queryAllByRole('heading')).toHaveLength(0)
    expect(paneBody.textContent?.trim()).toBe('')
    expect(
      within(paneBody).getByRole('group', { name: 'Loading task details' }),
    ).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps the toggle real and More disabled while loading', async () => {
    await mountScenario('loading-pane', WIDE)
    expect(screen.getByRole('button', { name: 'Hide right pane' })).toHaveAttribute(
      'aria-controls',
      'task-details-pane',
    )
    expect(screen.getByRole('button', { name: 'More actions' })).toBeDisabled()
  })
})

describe('topbar-facts chips', () => {
  it('opens with What was enforced expanded and focused', async () => {
    await mountScenario('topbar-facts', WIDE)
    expect(pane()).not.toBeNull()
    expect(selectedTab()).toBe('Events')
    expect(expandedGroups()).toEqual(['enforcement'])
    expect(
      document.querySelector('details[data-group="enforcement"] summary'),
    ).toHaveTextContent('What was enforced')
    // Meta yields to the chips when the pane is open with notices.
    expect(meta()).toHaveLength(0)
  })

  it.each([
    ['Show 2 notices', 'notices'],
    ['Observation resumed after a restart. Show details.', 'continuity'],
    ['Can edit this repo. Show what was enforced.', 'enforcement'],
  ])('chip "%s" expands the %s group and focuses its summary', async (label, group) => {
    const user = userEvent.setup()
    await mountScenario('topbar-facts', WIDE)
    await user.click(screen.getByRole('button', { name: label }))
    expect(expandedGroups()).toContain(group)
    const summary = document.querySelector<HTMLElement>(
      `details[data-group="${group}"] > summary`,
    )
    expect(summary).toHaveFocus()
    expect(summary).toHaveAttribute('data-m05-focus')
  })

  it('re-expands and refocuses after the user collapsed the group', async () => {
    const user = userEvent.setup()
    await mountScenario('topbar-facts', WIDE)
    const chip = screen.getByRole('button', { name: 'Show 2 notices' })
    await user.click(chip)
    const details = document.querySelector<HTMLDetailsElement>(
      'details[data-group="notices"]',
    ) as HTMLDetailsElement
    expect(details.open).toBe(true)
    const summary = details.querySelector('summary') as HTMLElement
    await user.click(summary)
    expect(details.open).toBe(false)
    await user.click(chip)
    const reopened = document.querySelector<HTMLDetailsElement>(
      'details[data-group="notices"]',
    ) as HTMLDetailsElement
    expect(reopened.open).toBe(true)
    expect(reopened.querySelector('summary')).toHaveFocus()
  })

  it('opens a closed pane on Events when a chip is clicked', async () => {
    const user = userEvent.setup()
    await mountScenario('pane-running-closed', WIDE)
    expect(pane()).toBeNull()
    await user.click(
      screen.getByRole('button', {
        name: 'Can edit this repo. Show what was enforced.',
      }),
    )
    expect(pane()).not.toBeNull()
    expect(selectedTab()).toBe('Events')
    expect(expandedGroups()).toEqual(['enforcement'])
  })
})

describe('topbar-resource', () => {
  it('shows the held resource card with name, age and slots control', async () => {
    await mountScenario('topbar-resource', WIDE)
    expect(screen.getByText(/Holding heavy-build/)).toBeInTheDocument()
    expect(screen.getByText('Since 4m ago')).toBeInTheDocument()
    expect(
      screen.getByText('Capacity remains reserved for this task.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Open resource slots')).toBeInTheDocument()
    expect(pane()).toBeNull()
    expect(meta()).toHaveLength(1)
  })
})
