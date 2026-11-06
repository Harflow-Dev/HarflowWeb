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
    const remove = screen.getByRole('button', { name: 'Remove Claude Code' })
    const approvals = screen.getByRole('button', {
      name: 'MCP approvals for Claude Code',
    })
    for (const control of [refresh, update, remove]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).toHaveAccessibleDescription(HARNESS_ACTION_EXPLANATION)
      expect(control).not.toHaveAttribute('title')
    }
    expect(approvals).toBeEnabled()
    expect(approvals).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'MCP approvals for Codex' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Tool approval' })).not.toBeInTheDocument()
    await user.click(refresh)
    fireEvent.click(update)
    fireEvent.click(remove)
    expect(approvals).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Server: ~/.harflow/bin/harflow-mcp')).toBeInTheDocument()
    expect(within(list).getByText('Update available')).toBeInTheDocument()
  })

  it('expands and collapses one harness list without changing approvals', async () => {
    const user = userEvent.setup()
    render(<SettingsHarnesses load={populatedHarnessesLoad()} />)
    const approvals = screen.getByRole('button', {
      name: 'MCP approvals for Claude Code',
    })
    approvals.focus()
    await user.keyboard('{Enter}')
    expect(approvals).toHaveFocus()
    expect(approvals).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', {
      name: 'MCP approvals for Claude Code',
    })
    expect(region).toHaveTextContent(
      'Global tool approvals apply across projects and future tasks.',
    )
    expect(within(region).getByText('harflow/*')).toBeInTheDocument()
    expect(within(region).getByText('github/create_pull_request')).toBeInTheDocument()
    expect(within(region).getByText('linear/get_issue')).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Harness registration' })
    const codex = within(list).getByText('Codex').closest('li')
    expect(codex).not.toHaveTextContent('harflow/*')
    const remove = within(region).getByRole('button', {
      name: 'Remove approval harflow/*',
    })
    const add = within(region).getByRole('button', { name: 'Add approval' })
    const field = within(region).getByRole('textbox', { name: 'Tool approval' })
    expect(remove).toBeDisabled()
    expect(remove).toHaveAccessibleDescription(HARNESS_ACTION_EXPLANATION)
    expect(add).toBeDisabled()
    expect(add).toHaveAccessibleDescription(HARNESS_ACTION_EXPLANATION)
    expect(field).toBeDisabled()
    expect(field).toHaveAttribute('placeholder', 'server/tool')
    expect(region).toHaveTextContent(
      'Use server/* to approve every tool on one server.',
    )
    fireEvent.click(remove)
    fireEvent.click(add)
    const form = field.closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)
    expect(within(region).getAllByRole('button', { name: /Remove approval / })).toHaveLength(3)
    await user.keyboard(' ')
    expect(approvals).toHaveFocus()
    expect(approvals).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('harflow/*')).not.toBeInTheDocument()
  })

  it('does not show another harness list or an empty list for unknown approvals', async () => {
    const user = userEvent.setup()
    render(
      <SettingsHarnesses
        load={{ kind: 'ready', observation: divergentHarnessesObservation() }}
      />,
    )
    const installed = screen.getByRole('button', {
      name: 'MCP approvals for Installed only',
    })
    const qualified = screen.getByRole('button', {
      name: 'MCP approvals for Registered and qualified',
    })
    await user.click(installed)
    const missing = screen.getByRole('region', {
      name: 'MCP approvals for Installed only',
    })
    expect(missing).toHaveTextContent(
      'MCP approvals for this harness are unavailable.',
    )
    expect(missing).not.toHaveTextContent('Global tool approvals')
    expect(within(missing).queryByRole('button', { name: /Remove approval/ })).not.toBeInTheDocument()
    expect(screen.queryByText('fixture/only-this-harness')).not.toBeInTheDocument()
    await user.click(qualified)
    expect(
      screen.queryByRole('region', { name: 'MCP approvals for Installed only' }),
    ).not.toBeInTheDocument()
    const owned = screen.getByRole('region', {
      name: 'MCP approvals for Registered and qualified',
    })
    expect(within(owned).getByText('fixture/only-this-harness')).toBeInTheDocument()
    expect(owned).not.toHaveTextContent('harflow/*')
    expect(
      screen.queryByText('MCP approvals for this harness are unavailable.'),
    ).not.toBeInTheDocument()
    expect(installed).toHaveAttribute('aria-expanded', 'false')
    expect(qualified).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not present missing approvals as an empty approved list', async () => {
    const user = userEvent.setup()
    render(
      <SettingsHarnesses
        load={{
          kind: 'ready',
          observation: {
            server: { kind: 'unknown' },
            harnesses: [
              {
                id: 'missing',
                label: 'Missing approvals',
                hint: null,
                install: { kind: 'installed' },
                registration: { kind: 'registered' },
                qualification: { kind: 'unknown' },
                approvals: null,
                actions: ['mcp-approvals'],
              },
            ],
          },
        }}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'MCP approvals for Missing approvals' }),
    )
    const region = screen.getByRole('region', {
      name: 'MCP approvals for Missing approvals',
    })
    expect(region).toHaveTextContent(
      'MCP approvals for this harness are unavailable.',
    )
    expect(region).not.toHaveTextContent('Global tool approvals')
    expect(within(region).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(region).queryByText('server/tool')).not.toBeInTheDocument()
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
