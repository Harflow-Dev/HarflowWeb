import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { populatedSidebar } from '../adapters/mock/fixtures'
import { Sidebar } from './Sidebar'
import {
  NewTaskLoadingComposer,
  SidebarListingSkeleton,
  TaskLoadingPage,
} from './skeletonWork'

afterEach(() => {
  cleanup()
})

describe('NewTaskLoadingComposer', () => {
  it('exposes busy naming with real greeting chrome and skeleton pills', () => {
    render(
      <div>
        <h1>What should we work on?</h1>
        <NewTaskLoadingComposer />
      </div>,
    )
    const loading = screen.getByRole('group', { name: 'Loading New task' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'What should we work on?' })).toBeInTheDocument()
    expect(screen.getByLabelText('Task prompt')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'More task options' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Start task' })).toBeDisabled()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThanOrEqual(3)
  })
})

describe('SidebarListingSkeleton', () => {
  it('renders Running and Recent placeholder rows without work titles', () => {
    render(<SidebarListingSkeleton />)
    expect(screen.getByLabelText('Running')).toBeInTheDocument()
    expect(screen.getByLabelText('Recent work')).toBeInTheDocument()
    expect(screen.queryByText('Fix flaky slot release test')).toBeNull()
    expect(document.querySelectorAll('.hd-task-row[aria-hidden="true"]').length).toBe(10)
  })

  it('keeps the Needs you count while only the listing loads', () => {
    render(
      <Sidebar
        collapsed={false}
        appearance="light"
        activeRoute="new-task"
        activeTaskId={null}
        activeParallelGroupId={null}
        sidebar={populatedSidebar()}
        listingLoading
        needsYou={{ kind: 'count', count: 3 }}
        onCollapse={vi.fn()}
        onAppearance={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTask={vi.fn()}
        onOpenParallelGroup={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveTextContent('3')
  })

  it('replaces work rows when Sidebar listingLoading is set', () => {
    const { rerender } = render(
      <Sidebar
        collapsed={false}
        appearance="light"
        activeRoute="new-task"
        activeTaskId={null}
        activeParallelGroupId={null}
        sidebar={populatedSidebar()}
        listingLoading
        needsYouLoading
        needsYou={{ kind: 'unknown' }}
        onCollapse={vi.fn()}
        onAppearance={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTask={vi.fn()}
        onOpenParallelGroup={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    const aside = screen.getByRole('complementary', { name: 'Sidebar' })
    expect(
      within(aside).getByRole('group', { name: 'Loading tasks' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(within(aside).getByRole('status')).toHaveTextContent('Loading tasks')
    expect(screen.queryByText('Fix flaky slot release test')).toBeNull()
    expect(screen.queryByText('3')).toBeNull()
    expect(aside.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)

    rerender(
      <Sidebar
        collapsed={false}
        appearance="light"
        activeRoute="new-task"
        activeTaskId={null}
        activeParallelGroupId={null}
        sidebar={populatedSidebar()}
        listingLoading={false}
        needsYou={{ kind: 'count', count: 3 }}
        onCollapse={vi.fn()}
        onAppearance={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTask={vi.fn()}
        onOpenParallelGroup={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Loading tasks' })).toBeNull()
    expect(screen.getByText('Fix flaky slot release test')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveTextContent('3')
  })
})

describe('TaskLoadingPage', () => {
  it('shows busy task skeleton without Stop label or transcript copy', () => {
    render(<TaskLoadingPage />)
    const loading = screen.getByRole('group', { name: 'Loading Task' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/Running tests/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Stop/ })).toBeNull()
    expect(within(loading).getByLabelText('Message this task')).toBeDisabled()
    expect(within(loading).getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(loading.querySelectorAll('.hd-skel--shimmer').length).toBeGreaterThan(0)
  })
})
