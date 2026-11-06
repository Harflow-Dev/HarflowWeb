import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  divergentHarnessesObservation,
  populatedHarnessesLoad,
  unavailableHarnessesLoad,
} from '../adapters/mock/harnessFixtures'
import { SettingsHarnesses, HARNESS_ACTION_EXPLANATION } from './SettingsHarnesses'

afterEach(() => {
  cleanup()
})

describe('SettingsHarnesses', () => {
  it('shows independent specimen facts and blocks unavailable actions', async () => {
    const user = userEvent.setup()
    render(<SettingsHarnesses load={populatedHarnessesLoad()} />)
    const list = screen.getByRole('list', { name: 'Harness registration' })
    const claude = within(list).getByText('Claude Code').closest('li')
    expect(claude).not.toBeNull()
    expect(claude).toHaveTextContent('Installed')
    expect(claude).toHaveTextContent('MCP registered')
    expect(
      screen.getByRole('region', { name: 'Harness qualification' }),
    ).toHaveTextContent('Ready')

    const antigravity = within(list).getByText('Antigravity').closest('li')
    expect(antigravity).toHaveTextContent('Not found on PATH')
    expect(antigravity).toHaveTextContent('Registration unknown')
    expect(antigravity).not.toHaveTextContent('Not registered')
    expect(antigravity).not.toHaveTextContent('Ready')

    const refresh = screen.getByRole('button', { name: 'Refresh' })
    const update = screen.getByRole('button', { name: 'Update Codex' })
    const approvals = screen.getByRole('button', {
      name: 'MCP approvals for Claude Code',
    })
    for (const control of [refresh, update, approvals]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).toHaveAccessibleDescription(HARNESS_ACTION_EXPLANATION)
      expect(control).not.toHaveAttribute('title')
    }
    expect(screen.queryByRole('textbox', { name: 'Tool approval' })).not.toBeInTheDocument()
    await user.click(refresh)
    fireEvent.click(update)
    fireEvent.keyDown(approvals, { key: ' ', code: 'Space' })
    expect(screen.getByText('Server: ~/.harflow/bin/harflow-mcp')).toBeInTheDocument()
    expect(within(list).getByText('Update available')).toBeInTheDocument()
  })

  it('renders divergent and unknown facts without collapsing them', () => {
    render(
      <SettingsHarnesses
        load={{ kind: 'ready', observation: divergentHarnessesObservation() }}
      />,
    )
    expect(
      screen.getByText('MCP server registration is unknown.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/~\/.harflow/)).not.toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Harness registration' })
    const installedOnly = within(list).getByText('Installed only').closest('li')
    expect(installedOnly).toHaveTextContent('Installed')
    expect(installedOnly).toHaveTextContent('Not registered')
    expect(installedOnly).not.toHaveTextContent('Registration unknown')
    const qualified = within(list)
      .getByText('Registered and qualified')
      .closest('li')
    expect(qualified).toHaveTextContent('Unknown')
    expect(qualified).toHaveTextContent('MCP registered')
    expect(qualified).not.toHaveTextContent('Not found on PATH')
    expect(qualified).not.toHaveTextContent('Not installed')
    const qualification = screen.getByRole('region', {
      name: 'Harness qualification',
    })
    expect(qualification).toHaveTextContent('Registered and qualified')
    expect(qualification).toHaveTextContent('Ready')
    expect(qualification).toHaveTextContent('Installed only')
    expect(within(qualification).getAllByText('Unknown')).toHaveLength(1)
  })

  it('drops ready facts while loading or unavailable', () => {
    const view = render(<SettingsHarnesses load={populatedHarnessesLoad()} />)
    expect(screen.getAllByText('Claude Code').length).toBeGreaterThan(0)
    view.rerender(<SettingsHarnesses load={{ kind: 'loading' }} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading harness registration…',
    )
    expect(screen.queryByText('Claude Code')).not.toBeInTheDocument()
    expect(screen.queryByText('Installed')).not.toBeInTheDocument()
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
    view.rerender(<SettingsHarnesses load={unavailableHarnessesLoad()} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Harness registration is unavailable.',
    )
    expect(screen.queryByText('Claude Code')).not.toBeInTheDocument()
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
    expect(screen.queryByText('Not found on PATH')).not.toBeInTheDocument()
  })
})
