import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { populatedSidebar } from '../adapters/mock/fixtures'
import { Sidebar } from './Sidebar'

afterEach(() => {
  cleanup()
})

describe('Sidebar centered shell', () => {
  it('renders collapsed rail with expand control and route buttons', () => {
    render(
      <Sidebar
        collapsed
        appearance="light"
        activeRoute="new-task"
        activeTaskId={null}
        activeParallelGroupId={null}
        sidebar={populatedSidebar()}
        needsYou={{ kind: 'clear' }}
        onCollapse={vi.fn()}
        onAppearance={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTask={vi.fn()}
        onOpenParallelGroup={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument()
    expect(document.querySelector('.hd-rail')).not.toBeNull()
    expect(document.querySelector('.hw-sidebar-scroll')).toBeNull()
  })

  it('keeps nav, Running, Recent, and Settings with aria-current on expanded', () => {
    render(
      <Sidebar
        collapsed={false}
        appearance="light"
        activeRoute="new-task"
        activeTaskId={null}
        activeParallelGroupId={null}
        sidebar={populatedSidebar()}
        needsYou={{ kind: 'count', count: 3 }}
        onCollapse={vi.fn()}
        onAppearance={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTask={vi.fn()}
        onOpenParallelGroup={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    const sidebar = screen.getByLabelText('Sidebar')
    expect(sidebar.querySelector('.hw-sidebar-scroll')).not.toBeNull()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New task/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('region', { name: 'Running' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Recent work' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Settings/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toBeInTheDocument()
  })
})
