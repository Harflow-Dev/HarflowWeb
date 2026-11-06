import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  EDITOR_NIGHTLY_ID,
  EDITOR_RELEASE_ID,
  workflowEditorLoadFor,
} from '../adapters/mock/workflowEditorFixtures'
import type { WorkflowEditorDefinition, WorkflowId, WorkflowNodeId } from '../model'
import { WorkflowEditorView } from './WorkflowEditorView'

const RELEASE_INSTRUCTIONS =
  'Choose the next node from the run so far. Prefer the review path when tests pass, and stop for the person if a release gate cannot be verified.'
const NIGHTLY_INSTRUCTIONS =
  'Choose the next node from the lockfile audit. Repeat Audit lockfiles when a dependency is still unresolved, and stop for the person if the lockfile cannot be read.'

function definitionFor(id: WorkflowId): WorkflowEditorDefinition {
  const load = workflowEditorLoadFor(id)
  if (load.kind !== 'ready') throw new Error('fixture')
  return load.definition
}

function EditorHarness({ definition }: { readonly definition: WorkflowEditorDefinition }) {
  const [selected, setSelected] = useState<WorkflowNodeId | null>(definition.defaultSelectedId)
  return (
    <WorkflowEditorView
      definition={definition}
      selectedId={selected}
      onClose={() => undefined}
      onSelect={setSelected}
    />
  )
}

afterEach(() => {
  cleanup()
})

describe('Orchestrator inspector', () => {
  it('shows the Release specimen sections and keeps the orchestrator disconnected', async () => {
    const user = userEvent.setup()
    const definition = definitionFor(EDITOR_RELEASE_ID)
    render(<EditorHarness definition={definition} />)
    const canvas = screen.getByLabelText('Workflow canvas')
    expect(within(canvas).queryByRole('button', { name: 'Orchestrator, locked' })).toBeNull()
    const orchestratorId = definition.nodes.find((node) => node.visual === 'orchestrator')?.id
    expect(definition.edges.some((edge) => edge.from === orchestratorId || edge.to === orchestratorId)).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Orchestrator, locked' }))
    const inspector = screen.getByRole('complementary', { name: 'Orchestrator settings' })
    expect(within(inspector).getByText("Every workflow has one. It can't be removed.")).toBeInTheDocument()
    expect(within(inspector).getByRole('heading', { name: 'AGENT' })).toBeInTheDocument()
    expect(within(inspector).getByRole('heading', { name: 'INSTRUCTIONS' })).toBeInTheDocument()
    expect(within(inspector).getByRole('heading', { name: 'LIMITS' })).toBeInTheDocument()
    expect(within(inspector).getByRole('button', { name: 'Harness' })).toHaveTextContent('Claude Code')
    expect(within(inspector).getByRole('button', { name: 'Model' })).toHaveTextContent('Opus 5.5')
    expect(within(inspector).getByRole('button', { name: 'Effort' })).toHaveTextContent('High')
    expect(within(inspector).getByRole('textbox', { name: 'Turn limit' })).toHaveValue('')
    expect(within(inspector).getByRole('switch', { name: 'Caller approvals' })).not.toBeChecked()
    expect(within(inspector).getByText('Codex · gpt-6-astra')).toBeInTheDocument()
    expect(within(inspector).getByRole('textbox', { name: 'Orchestrator instructions' })).toHaveValue(RELEASE_INSTRUCTIONS)
    expect(within(inspector).getByText('3')).toBeInTheDocument()
    expect(within(inspector).getByText('20')).toBeInTheDocument()
    expect(within(inspector).getByText('5')).toBeInTheDocument()
    expect(within(inspector).getByText('4')).toBeInTheDocument()
    expect(within(inspector).getByText('100')).toBeInTheDocument()
    expect(within(inspector).getByText('Select a node or connection to edit its instructions and conditions.')).toBeInTheDocument()
    expect(within(inspector).queryByRole('button', { name: 'Delete node' })).toBeNull()
    for (const control of within(inspector).getAllByRole('button')) {
      expect(control).toBeDisabled()
    }
    expect(within(inspector).getByRole('switch', { name: 'Caller approvals' })).toBeDisabled()
    expect(canvas.querySelectorAll('path[data-loop]')).toHaveLength(8)
  })

  it('keeps Nightly orchestrator values separate from Release', async () => {
    const user = userEvent.setup()
    render(<EditorHarness definition={definitionFor(EDITOR_NIGHTLY_ID)} />)
    await user.click(screen.getByRole('button', { name: 'Orchestrator, locked' }))
    const inspector = screen.getByRole('complementary', { name: 'Orchestrator settings' })
    expect(within(inspector).getByRole('textbox', { name: 'Orchestrator instructions' })).toHaveValue(NIGHTLY_INSTRUCTIONS)
    expect(within(inspector).queryByDisplayValue(RELEASE_INSTRUCTIONS)).toBeNull()
    expect(within(inspector).getAllByText('2').length).toBeGreaterThan(0)
    expect(within(inspector).getByText('12')).toBeInTheDocument()
    expect(within(inspector).getByText('1')).toBeInTheDocument()
    expect(within(inspector).getByText('40')).toBeInTheDocument()
    expect(within(inspector).queryByText('100')).toBeNull()
    expect(within(inspector).queryByRole('button', { name: 'Delete node' })).toBeNull()
    expect(screen.getByLabelText('Workflow canvas').querySelectorAll('path[data-loop]')).toHaveLength(3)
  })
})
