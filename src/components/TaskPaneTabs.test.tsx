import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { TaskPaneTabs } from './TaskPaneTabs'

afterEach(cleanup)

function tabs(activeTab: 'changes' | 'events') {
  return (
    <TaskPaneTabs
      changesCount={null}
      activeTab={activeTab}
      onSelectTab={() => undefined}
      onClosePane={() => undefined}
      onUnavailable={() => undefined}
    />
  )
}

const stop = (name: string) =>
  screen.getByRole('tab', { name }).getAttribute('tabindex')

describe('TaskPaneTabs roving tab stop', () => {
  it('follows the active tab when it changes while focus is outside the tablist', () => {
    const { rerender } = render(tabs('changes'))
    expect(stop('Changes')).toBe('0')
    expect(stop('Events')).toBe('-1')
    rerender(tabs('events'))
    expect(stop('Events')).toBe('0')
    expect(stop('Changes')).toBe('-1')
  })

  it('keeps roving focus when the active tab changes from inside the tablist', async () => {
    const user = userEvent.setup()
    const { rerender } = render(tabs('changes'))
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(stop('Artifacts')).toBe('0')
    rerender(tabs('events'))
    expect(stop('Artifacts')).toBe('0')
  })
})
