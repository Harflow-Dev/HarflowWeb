import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ResourcesLoadingPage,
  StatisticsLoadingBody,
} from './skeletonCapacity'
import {
  SettingsGeneralLoading,
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
    expect(loading.querySelectorAll('.hd-card').length).toBe(4)
  })

  it('keeps statistics labels while figures shimmer', () => {
    render(<StatisticsLoadingBody />)
    const loading = screen.getByRole('group', { name: 'Loading Statistics' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Tasks run')).toBeInTheDocument()
    expect(screen.getByText('By harness')).toBeInTheDocument()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })

  it('renders settings general, harnesses, and MCP approvals variants', () => {
    const { rerender } = render(
      <SettingsGeneralLoading appearance="light" onAppearance={() => undefined} />,
    )
    expect(screen.getByRole('group', { name: 'Loading Settings' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByText('Behaviour')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check for updates' })).toBeDisabled()

    rerender(<SettingsHarnessesLoading />)
    expect(screen.getByText('Harness qualification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()

    rerender(<SettingsMcpApprovalsLoading />)
    expect(document.querySelectorAll('.hd-form-row[aria-hidden="true"]').length).toBeGreaterThan(
      5,
    )
  })
})
