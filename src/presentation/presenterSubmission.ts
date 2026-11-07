import type { StartTaskUseCase } from '../application'
import type { StartTaskOutcome, TaskId } from '../model'
import type { NewTaskScreenState } from './screenState'

export type SubmissionHost = {
  isDisposed(): boolean
  getState(): NewTaskScreenState
  getSubmissionEpoch(): number
  setSubmissionEpoch(value: number): void
  publishPartial(partial: Partial<NewTaskScreenState>): void
}

/** Starts a task when the composer is submittable. */
export function submitNewTask(host: SubmissionHost, startTask: StartTaskUseCase): void {
  const state = host.getState()
  if (
    host.isDisposed() ||
    !state.canSubmit ||
    state.submission.kind === 'pending' ||
    state.submission.kind === 'unknown'
  ) {
    return
  }
  const repositoryId = state.selectedRepositoryId
  const harnessId = state.selectedHarnessId
  const modelId = state.selectedModelId
  if (repositoryId === null || harnessId === null || modelId === null) return
  const request = {
    prompt: state.prompt,
    repositoryId,
    harnessId,
    modelId,
    access: state.selectedAccess,
  }
  const submissionGen = host.getSubmissionEpoch() + 1
  host.setSubmissionEpoch(submissionGen)
  host.publishPartial({ submission: { kind: 'pending' }, openMenu: null })
  void startTask.execute(request).then((outcome) => {
    applyNewTaskSubmission(host, outcome, submissionGen)
  })
}

export function applyNewTaskSubmission(
  host: SubmissionHost,
  outcome: StartTaskOutcome,
  gen: number,
): void {
  if (host.isDisposed() || gen !== host.getSubmissionEpoch()) return
  if (outcome.kind === 'accepted') {
    const taskId: TaskId = outcome.taskId
    host.publishPartial({ submission: { kind: 'accepted', taskId }, prompt: '' })
    return
  }
  if (outcome.kind === 'refused') {
    host.publishPartial({
      submission: {
        kind: 'refused',
        code: outcome.code,
        reason: outcome.reason,
      },
    })
    return
  }
  host.publishPartial({ submission: { kind: 'unknown', message: outcome.message } })
}
