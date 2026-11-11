import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ResourcesLoadingPage,
  StatisticsLoadingBody,
} from './skeletonCapacity'
import { SettingsGeneral } from './SettingsGeneral'
import {
  SettingsHarnessesLoading,
  SettingsMcpApprovalsLoading,
} from './skeletonSettings'

afterEach(() => {
  cleanup()
})

describe('Capacity and settings loading skeletons', () => {
  it('renders resources cards and waiting row placeholders', () => {
    render(<ResourcesLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Resources' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument()
    expect(screen.getByText('Waiting for a slot')).toBeInTheDocument()
    expect(loading.querySelectorAll('.hd-card').length).toBe(5)
  })

  it('keeps statistics labels while figures shimmer', () => {
    render(<StatisticsLoadingBody />)
    const loading = screen.getByRole('group', { name: 'Loading Statistics' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Tasks run')).toBeInTheDocument()
    expect(screen.getByText('By harness')).toBeInTheDocument()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })

  it('renders settings general placeholders without moving the section structure', () => {
    render(
      <SettingsGeneral
        load={{ kind: 'loading' }}
        appearance="light"
        onAppearance={() => undefined}
        onUnavailable={() => undefined}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading settings')
    expect(screen.getByText('Behaviour')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })

  it('renders settings harnesses and MCP approvals variants', () => {
    const { rerender } = render(<SettingsHarnessesLoading />)
    expect(screen.getByRole('group', { name: 'Loading Harnesses' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading harness')
    expect(screen.getByText('Harness qualification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()
    expect(screen.queryByTestId('mcp-approvals-skeleton')).toBeNull()

    rerender(<SettingsMcpApprovalsLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading MCP approvals')
    expect(screen.getAllByTestId('mcp-approvals-skeleton')).toHaveLength(1)
  })

  it('announces loading politely in each capacity skeleton', () => {
    const { rerender } = render(<ResourcesLoadingPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading resources')
    rerender(<StatisticsLoadingBody />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading statistics')
  })
})
