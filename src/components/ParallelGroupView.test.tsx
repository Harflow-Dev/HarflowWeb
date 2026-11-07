import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  PARALLEL_GROUP_UNAVAILABLE,
  type ParallelGroupLoad,
} from '../model'
import {
  parallelGroupLoadFor,
  PRELOAD_PARALLEL_GROUP_ID,
  preloadParallelGroup,
} from '../adapters/mock/parallelGroupFixtures'
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

describe('ParallelGroupView', () => {
  it('renders the top bar and all three lane headers and bodies', () => {
    render(<ParallelGroupView load={readyLoad()} />)

    expect(screen.getByText('Review preload bridge')).toBeInTheDocument()
    expect(screen.getByText('1 running · 2 done')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Enforced for every agent here: Network: not controlled.',
      ),
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

  it('disables View prompt, Cancel all, lane actions, tools, and composers', () => {
    render(<ParallelGroupView load={readyLoad()} />)

    const viewPrompt = screen.getByRole('button', { name: 'View prompt' })
    expect(viewPrompt).toBeDisabled()
    expect(viewPrompt).toHaveAccessibleDescription(
      PARALLEL_GROUP_ACTION_EXPLANATION,
    )

    const cancelAll = screen.getByRole('button', { name: 'Cancel all' })
    expect(cancelAll).toBeDisabled()
    expect(cancelAll).toHaveAccessibleDescription(
      PARALLEL_GROUP_ACTION_EXPLANATION,
    )

    const laneActions = screen.getAllByRole('button', { name: 'Lane actions' })
    expect(laneActions).toHaveLength(3)
    for (const button of laneActions) {
      expect(button).toBeDisabled()
      expect(button).toHaveAccessibleDescription(PARALLEL_GROUP_LANE_EXPLANATION)
    }

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

  it('shows unavailable for missing groups and empty lanes', () => {
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
          group: { ...empty, lanes: [] },
        }}
      />,
    )
    expect(
      screen.getByText(PARALLEL_GROUP_UNAVAILABLE),
    ).toBeInTheDocument()
    expect(screen.queryByText('Claude Code')).not.toBeInTheDocument()
  })
})
