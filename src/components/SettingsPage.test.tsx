import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  divergentHarnessesObservation,
  populatedHarnessesLoad,
  unavailableHarnessesLoad,
} from '../adapters/mock/harnessFixtures'
import type { HarnessesLoad } from '../model'
import type { SettingsSection } from '../presentation'
import { SettingsPage } from './SettingsPage'

const EXPLANATION =
  'Mock specimen values. These are not saved preferences or active notification settings.'

const ROWS: readonly { name: string; checked: 'true' | 'false' }[] = [
  { name: 'Open the window when a task starts', checked: 'false' },
  { name: 'Notify when a task finishes', checked: 'true' },
  { name: 'Notify when a request needs you', checked: 'true' },
]

afterEach(() => {
  cleanup()
})

describe('SettingsPage behaviour switches', () => {
  it('identifies unavailable specimen values and ignores activation', async () => {
    const user = userEvent.setup()
    const onAppearance = vi.fn()
    const onUnavailable = vi.fn()
    render(
      <SettingsPage
        section="general"
        onSection={() => undefined}
        appearance="dark"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
        harnesses={{ kind: 'loading' }}
      />,
    )

    expect(screen.getByText(EXPLANATION)).toBeInTheDocument()
    for (const row of ROWS) {
      const control = screen.getByRole('switch', { name: row.name })
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).toHaveAttribute('aria-checked', row.checked)
      expect(control).toHaveAccessibleDescription(EXPLANATION)
      expect(control).not.toHaveAttribute('title')
      fireEvent.click(control)
      fireEvent.keyDown(control, { key: ' ', code: 'Space' })
      fireEvent.keyUp(control, { key: ' ', code: 'Space' })
      expect(control).toHaveAttribute('aria-checked', row.checked)
    }

    const finish = screen.getByRole('switch', {
      name: 'Notify when a task finishes',
    })
    await user.click(finish)
    expect(finish).toHaveAttribute('aria-checked', 'true')
    expect(onAppearance).not.toHaveBeenCalled()
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('keeps the theme control operable beside the unavailable switches', async () => {
    const user = userEvent.setup()
    const onAppearance = vi.fn()
    const onUnavailable = vi.fn()
    const view = render(
      <SettingsPage
        section="general"
        onSection={() => undefined}
        appearance="system"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
        harnesses={{ kind: 'loading' }}
      />,
    )

    const theme = screen.getByRole('group', { name: 'Theme' })
    await user.click(within(theme).getByRole('button', { name: 'Light' }))
    expect(onAppearance).toHaveBeenCalledTimes(1)
    expect(onAppearance).toHaveBeenCalledWith('light')
    view.rerender(
      <SettingsPage
        section="general"
        onSection={() => undefined}
        appearance="light"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
        harnesses={{ kind: 'loading' }}
      />,
    )
    expect(
      within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', {
        name: 'Light',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(onUnavailable).not.toHaveBeenCalled()
    for (const row of ROWS) {
      expect(screen.getByRole('switch', { name: row.name })).toBeDisabled()
    }
  })
})

describe('Settings section tabs', () => {
  it('moves focus with arrows, Home, and End without selecting', async () => {
    const user = userEvent.setup()
    const onSection = vi.fn()
    render(
      <SettingsPage
        section="general"
        onSection={onSection}
        appearance="light"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
        harnesses={{ kind: 'loading' }}
      />,
    )
    const general = screen.getByRole('tab', { name: 'General' })
    const harnesses = screen.getByRole('tab', { name: 'Harnesses' })
    expect(general).toHaveAttribute('tabindex', '0')
    expect(harnesses).toHaveAttribute('tabindex', '-1')
    general.focus()
    await user.keyboard('{ArrowRight}')
    expect(harnesses).toHaveFocus()
    expect(harnesses).toHaveAttribute('tabindex', '0')
    expect(general).toHaveAttribute('tabindex', '-1')
    expect(general).toHaveAttribute('aria-selected', 'true')
    expect(harnesses).toHaveAttribute('aria-selected', 'false')
    expect(onSection).not.toHaveBeenCalled()
    await user.keyboard('{Home}')
    expect(general).toHaveFocus()
    await user.keyboard('{End}')
    expect(harnesses).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(general).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(harnesses).toHaveFocus()
    await user.tab()
    expect(harnesses).not.toHaveFocus()
    expect(general).not.toHaveFocus()
  })

  it('selects the focused tab and associates it with the visible panel', async () => {
    const user = userEvent.setup()
    render(
      <ControlledSettings
        appearance="system"
        initial="general"
        harnesses={populatedHarnessesLoad()}
      />,
    )
    const general = screen.getByRole('tab', { name: 'General' })
    const harnesses = screen.getByRole('tab', { name: 'Harnesses' })
    const panel = screen.getByRole('tabpanel')
    expect(general).toHaveAttribute('id', 'settings-tab-general')
    expect(general).toHaveAttribute('aria-controls', 'settings-panel-general')
    expect(panel).toHaveAttribute('id', 'settings-panel-general')
    expect(panel).toHaveAttribute('aria-labelledby', 'settings-tab-general')
    harnesses.focus()
    await user.keyboard('{Enter}')
    expect(harnesses).toHaveAttribute('aria-selected', 'true')
    expect(general).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'id',
      'settings-panel-harnesses',
    )
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'settings-tab-harnesses',
    )
    expect(harnesses).toHaveAttribute('aria-controls', 'settings-panel-harnesses')
    expect(harnesses).toHaveFocus()
  })

  it('keeps tab focus when the harness observation changes', async () => {
    const user = userEvent.setup()
    const onSection = vi.fn()
    const view = render(
      <SettingsPage
        section="harnesses"
        onSection={onSection}
        appearance="dark"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
        harnesses={populatedHarnessesLoad()}
      />,
    )
    const general = screen.getByRole('tab', { name: 'General' })
    const harnesses = screen.getByRole('tab', { name: 'Harnesses' })
    harnesses.focus()
    view.rerender(
      <SettingsPage
        section="harnesses"
        onSection={onSection}
        appearance="dark"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
        harnesses={{ kind: 'loading' }}
      />,
    )
    expect(harnesses).toHaveFocus()
    expect(harnesses).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'settings-tab-harnesses',
    )
    await user.keyboard('{ArrowLeft}')
    expect(general).toHaveFocus()
    view.rerender(
      <SettingsPage
        section="harnesses"
        onSection={onSection}
        appearance="dark"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
        harnesses={unavailableHarnessesLoad()}
      />,
    )
    expect(general).toHaveFocus()
    expect(harnesses).toHaveAttribute('aria-selected', 'true')
    expect(general).toHaveAttribute('aria-selected', 'false')
    expect(onSection).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Harness registration is unavailable.',
    )
  })

  it('keeps disabled harness actions and independent fixture facts', () => {
    render(
      <SettingsPage
        section="harnesses"
        onSection={() => undefined}
        appearance="light"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
        harnesses={{
          kind: 'ready',
          observation: divergentHarnessesObservation(),
        }}
      />,
    )
    const list = screen.getByRole('list', { name: 'Harness registration' })
    const installedOnly = within(list).getByText('Installed only').closest('li')
    const qualified = within(list)
      .getByText('Registered and qualified')
      .closest('li')
    expect(installedOnly).toHaveTextContent('Installed')
    expect(installedOnly).toHaveTextContent('Not registered')
    expect(qualified).toHaveTextContent('Unknown')
    expect(qualified).toHaveTextContent('MCP registered')
    expect(qualified).not.toHaveTextContent('Not found on PATH')
    const refresh = screen.getByRole('button', { name: 'Refresh' })
    expect(refresh).toBeDisabled()
    expect(refresh).toHaveAccessibleDescription(/does not install, register, refresh/)
    fireEvent.click(refresh)
    expect(screen.getByText('MCP server registration is unknown.')).toBeInTheDocument()
  })
})

function ControlledSettings({
  initial,
  harnesses,
  appearance,
}: {
  readonly initial: SettingsSection
  readonly harnesses: HarnessesLoad
  readonly appearance: 'system' | 'light' | 'dark'
}) {
  const [section, setSection] = useState(initial)
  return (
    <SettingsPage
      section={section}
      onSection={setSection}
      appearance={appearance}
      onAppearance={() => undefined}
      onUnavailable={() => undefined}
      harnesses={harnesses}
    />
  )
}
