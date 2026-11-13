import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PARALLEL_GROUP_EMPTY_MESSAGE,
  PARALLEL_GROUP_UNAVAILABLE,
  type ParallelGroupLoad,
} from '../model'
import {
  emptyParallelGroup,
  parallelGroupLoadFor,
  PRELOAD_PARALLEL_GROUP_ID,
  preloadParallelGroup,
  titledParallelGroup,
  TITLED_PARALLEL_GROUP_ID,
} from '../adapters/mock/parallelGroupFixtures'
import { PRELOAD_TASK_ID } from '../adapters/mock/taskFixtures'
import { ParallelGroupView } from './ParallelGroupView'
import {
  PARALLEL_GROUP_ACTION_EXPLANATION,
  PARALLEL_GROUP_LANE_EXPLANATION,
  PARALLEL_GROUP_TOOL_EXPLANATION,
} from './parallelGroupUnavailable'

afterEach(() => {
  cleanup()
})

function readyLoad(): ParallelGroupLoad {
  return parallelGroupLoadFor(PRELOAD_PARALLEL_GROUP_ID)
}

function titledLoad(): ParallelGroupLoad {
  return parallelGroupLoadFor(TITLED_PARALLEL_GROUP_ID)
}

describe('ParallelGroupView', () => {
  it('renders the legacy top bar and all three lane headers and bodies', () => {
    render(<ParallelGroupView load={readyLoad()} />)

    expect(screen.getByText('Review preload bridge')).toBeInTheDocument()
    expect(screen.getByText('1 running · 2 done')).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'Enforced for every agent here: Network: not controlled.',
      )[0],
    ).toBeInTheDocument()

    const claude = screen.getByRole('region', { name: 'Claude Code' })
    expect(within(claude).getByText('Opus 5.5')).toBeInTheDocument()
    expect(within(claude).getByText('Running 03:24')).toBeInTheDocument()
    expect(
      within(claude).getByText(/Reviewing the preload bridge in/),
    ).toBeInTheDocument()
    expect(within(claude).getByText('src/preload/bridge.ts')).toBeInTheDocument()
    expect(within(claude).getByText('Read 6 files')).toBeInTheDocument()
    expect(within(claude).getByText('0:09')).toBeInTheDocument()
    expect(
      within(claude).getByText(/exposeInMainWorld/),
    ).toBeInTheDocument()
    expect(
      within(claude).getByText('rg "ipcRenderer" src/preload'),
    ).toBeInTheDocument()
    expect(
      within(claude).getByText('Reading src/preload/bridge.ts…'),
    ).toBeInTheDocument()

    const codex = screen.getByRole('region', { name: 'Codex' })
    expect(within(codex).getByText('gpt-6')).toBeInTheDocument()
    expect(within(codex).getByText('Done 04:51')).toBeInTheDocument()
    expect(within(codex).getByText('Three findings:')).toBeInTheDocument()
    expect(
      within(codex).getByText(/without a channel check/),
    ).toBeInTheDocument()
    expect(within(codex).getByText('ipcRenderer.invoke')).toBeInTheDocument()
    expect(
      within(codex).getByText('Done · 3 findings · 04:51'),
    ).toBeInTheDocument()

    const opencode = screen.getByRole('region', { name: 'Opencode' })
    expect(within(opencode).getByText('Kimi K3')).toBeInTheDocument()
    expect(within(opencode).getByText('Done 04:12')).toBeInTheDocument()
    expect(within(opencode).getByText('Two findings:')).toBeInTheDocument()
    expect(
      within(opencode).getByText('removeAllListeners'),
    ).toBeInTheDocument()
    expect(
      within(opencode).getByText('Done · 2 findings · 04:12'),
    ).toBeInTheDocument()
  })

  it('keeps Send and tools unavailable; View prompt and lane menu work', async () => {
    const user = userEvent.setup()
    const onShowPrompt = vi.fn()
    const onOpenMenuLaneId = vi.fn()
    render(
      <ParallelGroupView
        load={readyLoad()}
        onShowPrompt={onShowPrompt}
        onOpenMenuLaneId={onOpenMenuLaneId}
      />,
    )

    const viewPrompt = screen.getByRole('button', { name: 'View prompt' })
    expect(viewPrompt).not.toBeDisabled()
    await user.click(viewPrompt)
    expect(onShowPrompt).toHaveBeenCalledWith(true)

    const cancelAll = screen.getByRole('button', { name: 'Cancel all' })
    expect(cancelAll).not.toBeDisabled()

    const laneActions = screen.getAllByRole('button', { name: 'Lane actions' })
    expect(laneActions).toHaveLength(3)
    expect(laneActions[0]).not.toBeDisabled()

    const toolHeads = screen.getAllByRole('button', { expanded: false })
    expect(toolHeads.length).toBeGreaterThanOrEqual(4)
    for (const head of toolHeads) {
      if (!head.classList.contains('hd-tool__head')) continue
      expect(head).toBeDisabled()
      expect(head).toHaveAccessibleDescription(PARALLEL_GROUP_TOOL_EXPLANATION)
    }

    for (const name of ['Claude Code', 'Codex', 'Opencode'] as const) {
      const composer = screen.getByRole('textbox', {
        name: `Message ${name}`,
      })
      expect(composer).toBeDisabled()
      expect(composer).toHaveAccessibleDescription(
        PARALLEL_GROUP_LANE_EXPLANATION,
      )
      const send = screen.getByRole('button', { name: `Send to ${name}` })
      expect(send).toBeDisabled()
      expect(send).toHaveAccessibleDescription(PARALLEL_GROUP_LANE_EXPLANATION)
    }
  })

  it('keeps the Parallel group working glyph static', () => {
    render(<ParallelGroupView load={readyLoad()} />)
    const claude = screen.getByRole('region', { name: 'Claude Code' })
    const working = within(claude).getByText('Reading src/preload/bridge.ts…')
      .previousElementSibling
    expect(working).toHaveClass('hd-glyph', 'hd-glyph--running')
    expect(working).not.toHaveClass('is-animated')
  })

  it('shows unavailable for missing groups and empty lanes without emptyMessage', () => {
    const { rerender } = render(
      <ParallelGroupView
        load={{ kind: 'unavailable', message: PARALLEL_GROUP_UNAVAILABLE }}
      />,
    )
    expect(
      screen.getByText(PARALLEL_GROUP_UNAVAILABLE),
    ).toBeInTheDocument()

    const empty = preloadParallelGroup()
    rerender(
      <ParallelGroupView
        load={{
          kind: 'ready',
          group: { ...empty, lanes: [], emptyMessage: null },
        }}
      />,
    )
    expect(
      screen.getByText(PARALLEL_GROUP_UNAVAILABLE),
    ).toBeInTheDocument()
    expect(screen.queryByText('Claude Code')).not.toBeInTheDocument()
  })

  it('shows the approved empty group message', () => {
    render(
      <ParallelGroupView
        load={{ kind: 'ready', group: emptyParallelGroup() }}
      />,
    )
    expect(screen.getByText(PARALLEL_GROUP_EMPTY_MESSAGE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View prompt' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Cancel all' }),
    ).not.toBeInTheDocument()
  })
})

describe('ParallelGroupView titled lanes', () => {
  it('shows task titles and harness · model captions', () => {
    render(<ParallelGroupView load={titledLoad()} />)
    expect(
      screen.getByRole('region', {
        name: 'Audit what the preload bridge exposes',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Claude · Opus 5.5')).toBeInTheDocument()
    expect(screen.getByText('Codex · gpt-6')).toBeInTheDocument()
    expect(
      screen.getByRole('region', {
        name: 'Compare preload exports with renderer calls',
      }),
    ).toBeInTheDocument()
    const opencode = screen.getByRole('region', {
      name: 'Compare preload exports with renderer calls',
    })
    expect(within(opencode).getByText('Opencode')).toBeInTheDocument()
    expect(screen.getByText('Done · 04:51')).toBeInTheDocument()
    expect(screen.getByText('Done · 04:12')).toBeInTheDocument()
  })

  it('opens and closes the lane menu with Escape and returns focus', async () => {
    const user = userEvent.setup()
    let menuId: string | null = null
    const onOpenMenuLaneId = vi.fn((id: string | null) => {
      menuId = id
    })
    const { rerender } = render(
      <ParallelGroupView
        load={titledLoad()}
        openMenuLaneId={null}
        onOpenMenuLaneId={onOpenMenuLaneId}
      />,
    )
    const triggers = screen.getAllByRole('button', { name: 'Lane actions' })
    const firstTrigger = triggers[0]
    expect(firstTrigger).toBeTruthy()
    await user.click(firstTrigger!)
    expect(onOpenMenuLaneId).toHaveBeenCalledWith('lane-claude-titled')
    rerender(
      <ParallelGroupView
        load={titledLoad()}
        openMenuLaneId="lane-claude-titled"
        onOpenMenuLaneId={onOpenMenuLaneId}
      />,
    )
    expect(
      screen.getByRole('menuitem', { name: /Open task/ }),
    ).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onOpenMenuLaneId).toHaveBeenCalledWith(null)
    expect(menuId).toBeNull()
  })

  it('navigates Open task when mapped', async () => {
    const user = userEvent.setup()
    const onOpenTask = vi.fn()
    render(
      <ParallelGroupView
        load={titledLoad()}
        openMenuLaneId="lane-claude-titled"
        onOpenMenuLaneId={() => {}}
        onOpenTask={onOpenTask}
      />,
    )
    await user.click(screen.getByRole('menuitem', { name: /Open task/ }))
    expect(onOpenTask).toHaveBeenCalledWith(PRELOAD_TASK_ID)
  })

  it('reveals Original request when showPrompt is set', () => {
    render(<ParallelGroupView load={titledLoad()} showPrompt />)
    expect(screen.getAllByText('Original request')).toHaveLength(3)
    const prompt = titledParallelGroup().lanes[0]?.prompt
    expect(prompt).toBeTruthy()
    expect(screen.getByText(prompt!)).toBeInTheDocument()
  })

  it('opens Cancel all confirm, Escape dismisses and returns focus', async () => {
    const user = userEvent.setup()
    const onCancelAllConfirm = vi.fn()
    const { rerender } = render(
      <ParallelGroupView
        load={titledLoad()}
        cancelAllConfirm={false}
        onCancelAllConfirm={onCancelAllConfirm}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel all' }))
    expect(onCancelAllConfirm).toHaveBeenCalledWith(true)
    rerender(
      <ParallelGroupView
        load={titledLoad()}
        cancelAllConfirm
        onCancelAllConfirm={onCancelAllConfirm}
      />,
    )
    expect(
      screen.getByRole('dialog', {
        name: 'Cancel every running task in this group?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    const dialog = screen.getByRole('dialog')
    const danger = within(dialog).getByRole('button', { name: 'Cancel all' })
    expect(danger).toBeDisabled()
    expect(danger).toHaveAccessibleDescription(PARALLEL_GROUP_ACTION_EXPLANATION)
    await user.keyboard('{Escape}')
    expect(onCancelAllConfirm).toHaveBeenCalledWith(false)
  })
})
