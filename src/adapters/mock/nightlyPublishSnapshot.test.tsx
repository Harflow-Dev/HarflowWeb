import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NeedsYouPage } from '../../components/NeedsYouPage'
import { WorkflowRunView } from '../../components/WorkflowRunView'
import {
  NIGHTLY_PUBLISH_SNAPSHOT,
  NIGHTLY_REQUESTER_MODEL,
} from './nightlyPublishSnapshot'
import { waitingNeedsYouLoad, waitingNeedsYouObservation } from './needsYouFixtures'
import { NIGHTLY_AUDIT_RUN_ID, nightlyAuditRun, workflowExecutionLoadFor } from './workflowExecutionFixtures'

afterEach(() => {
  cleanup()
})

describe('Nightly publish snapshot', () => {
  it('shows the same branch, requester, repository, and publish action on both views', () => {
    const request = waitingNeedsYouObservation().items.find(
      (item) => item.id === 'approve-nightly-publish',
    )
    const run = nightlyAuditRun()
    const snapshot = NIGHTLY_PUBLISH_SNAPSHOT
    if (!request || request.kind !== 'approval') {
      throw new Error('missing nightly publish request')
    }
    expect(snapshot.publishAction).toContain(snapshot.branch)
    expect(snapshot.publishAction).toContain(snapshot.repository)
    expect(request.exactAction).toBe(run.detail.approval.body)
    expect(request.exactAction).toBe(snapshot.publishAction)
    expect(request.detail).toBe(`${snapshot.needsYouAccess} · ${NIGHTLY_REQUESTER_MODEL}`)
    expect(run.detail.agent).toBe(`${NIGHTLY_REQUESTER_MODEL} · ${snapshot.repository}`)
    expect(run.detail.approval.source).toBe(NIGHTLY_REQUESTER_MODEL)
    expect(run.detail.tools[0]?.summary).toBe(`git switch -c ${snapshot.branch}`)
    expect(run.detail.approval.command).toContain(`git push origin ${snapshot.branch}`)
    expect(run.detail.approval.command).toContain(snapshot.remote)

    render(
      <NeedsYouPage load={waitingNeedsYouLoad()} onOpenTask={vi.fn()} onOpenRun={vi.fn()} />,
    )
    expect(screen.getByText(snapshot.publishAction)).toBeInTheDocument()
    expect(screen.getByText(request.detail)).toBeInTheDocument()
    cleanup()

    render(<WorkflowRunView load={workflowExecutionLoadFor(NIGHTLY_AUDIT_RUN_ID)} />)
    const step = screen.getByRole('complementary', { name: 'Selected step' })
    expect(step).toHaveTextContent(snapshot.publishAction)
    expect(step).toHaveTextContent(`${NIGHTLY_REQUESTER_MODEL} · ${snapshot.repository}`)
    expect(step).toHaveTextContent(`git push origin ${snapshot.branch}`)
  })
})