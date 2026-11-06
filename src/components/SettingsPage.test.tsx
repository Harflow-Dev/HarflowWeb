import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
        appearance="dark"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
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
        appearance="system"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
      />,
    )

    const theme = screen.getByRole('group', { name: 'Theme' })
    await user.click(within(theme).getByRole('button', { name: 'Light' }))
    expect(onAppearance).toHaveBeenCalledTimes(1)
    expect(onAppearance).toHaveBeenCalledWith('light')
    view.rerender(
      <SettingsPage
        appearance="light"
        onAppearance={onAppearance}
        onUnavailable={onUnavailable}
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
