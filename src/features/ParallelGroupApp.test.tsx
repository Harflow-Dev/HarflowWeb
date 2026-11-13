import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { ScenarioId } from '../adapters/mock'
import {
  LOADING_TWO_PARALLEL_GROUP_ID,
  parallelGroupLoadFor,
  PRELOAD_PARALLEL_GROUP_ID,
  TITLED_PARALLEL_GROUP_ID,
  TWO_LANES_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { createApp, PreviewShell } from '../composition'
import { AppFeature } from './AppFeature'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function mount(scenario: ScenarioId) {
  const app = createApp(scenario)
  render(<AppFeature presenter={app.presenter} />)
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  return app
}

function sidebar(): Element {
  const found = document.querySelector('aside.hd-sidebar, aside.hd-rail')
  if (!found) throw new Error('sidebar not rendered')
  return found
}

describe('Parallel group session reset through the app', () => {
  it('reopening a group after navigating away starts without prompt, menu, or dialog', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () =>
      app.presenter.openParallelGroup(TITLED_PARALLEL_GROUP_ID),
    )
    await user.click(screen.getByRole('button', { name: 'View prompt' }))
    await user.click(screen.getAllByRole('button', { name: 'Lane actions' })[0]!)
    expect(app.presenter.getState().parallelGroup).toMatchObject({
      showPrompt: true,
      openMenuLaneId: 'lane-claude-titled',
    })
    await user.click(screen.getByRole('button', { name: 'Cancel all' }))
    expect(app.presenter.getState().parallelGroup.cancelAllConfirm).toBe(true)

    await act(async () => app.presenter.navigate('workflows'))
    expect(app.presenter.getState().parallelGroup).toMatchObject({
      groupId: null,
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
    })
    await act(async () =>
      app.presenter.openParallelGroup(TITLED_PARALLEL_GROUP_ID),
    )
    expect(app.presenter.getState().parallelGroup).toMatchObject({
      showPrompt: false,
      openMenuLaneId: null,
      cancelAllConfirm: false,
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('Original request')).toBeNull()
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('Cancel-all dialog at app level', () => {
  it('covers the whole app, makes sidebar and main inert, and returns focus on Escape and Cancel', async () => {
    const user = userEvent.setup()
    const app = await mount('populated')
    await act(async () =>
      app.presenter.openParallelGroup(TITLED_PARALLEL_GROUP_ID),
    )
    const trigger = screen.getByRole('button', { name: 'Cancel all' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', {
      name: 'Cancel every running task in this group?',
    })
    expect(dialog.closest('.hd-app')).not.toBeNull()
    expect(dialog.closest('main')).toBeNull()
    expect(sidebar()).toHaveAttribute('inert')
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(document.querySelectorAll('.hd-lanes[inert]')).toHaveLength(0)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(sidebar()).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Cancel all' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Cancel all' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Cancel all' })).toHaveFocus()
  })

  it('boots the cancel-all-confirm preview scenario through the seeding path', async () => {
    window.location.hash = '#parallel-group-cancel-all-confirm'
    render(<PreviewShell />)
    const dialog = await screen.findByRole('dialog', {
      name: 'Cancel every running task in this group?',
    })
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(sidebar()).toHaveAttribute('inert')
  })

  it('boots the prompt-shown preview scenario with prompts revealed', async () => {
    window.location.hash = '#parallel-group-prompt-shown'
    render(<PreviewShell />)
    await waitFor(() =>
      expect(screen.getAllByText('Original request')).toHaveLength(3),
    )
  })
})

describe('Parallel group deferred observation', () => {
  it('resolves a deferred observation into two lanes', async () => {
    const app = await mount('parallel-group-loading')
    await act(async () =>
      app.presenter.openParallelGroup(TWO_LANES_PARALLEL_GROUP_ID),
    )
    const busy = screen.getByRole('group', { name: 'Loading Parallel group' })
    expect(busy.querySelectorAll('.hd-lane')).toHaveLength(2)
    expect(app.presenter.getState().parallelGroup.load).toEqual({
      kind: 'loading',
      memberCount: 2,
    })
    await act(async () => {
      app.mock.publishParallelGroup(
        TWO_LANES_PARALLEL_GROUP_ID,
        parallelGroupLoadFor(TWO_LANES_PARALLEL_GROUP_ID),
      )
      await Promise.resolve()
    })
    expect(
      screen.queryByRole('group', { name: 'Loading Parallel group' }),
    ).toBeNull()
    const region = screen.getByRole('region', { name: 'Parallel group lanes' })
    expect(within(region).getAllByRole('region')).toHaveLength(2)
  })

  it('shows two skeleton lanes when the member count is unknown', async () => {
    const app = await mount('parallel-group-loading')
    await act(async () =>
      app.presenter.openParallelGroup(LOADING_TWO_PARALLEL_GROUP_ID),
    )
    expect(app.presenter.getState().parallelGroup.load).toEqual({
      kind: 'loading',
      memberCount: null,
    })
    expect(
      screen
        .getByRole('group', { name: 'Loading Parallel group' })
        .querySelectorAll('.hd-lane'),
    ).toHaveLength(2)
  })

  it('shows three skeleton lanes for a known three-member group', async () => {
    const app = await mount('parallel-group-loading')
    await act(async () =>
      app.presenter.openParallelGroup(PRELOAD_PARALLEL_GROUP_ID),
    )
    expect(
      screen
        .getByRole('group', { name: 'Loading Parallel group' })
        .querySelectorAll('.hd-lane'),
    ).toHaveLength(3)
  })
})
