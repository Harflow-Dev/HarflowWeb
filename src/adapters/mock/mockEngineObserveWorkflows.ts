import type {
  ParallelGroupId,
  ParallelGroupLoad,
  WorkflowEditorLoad,
  WorkflowId,
  WorkflowRunLoad,
} from '../../model'
import { createKeyedObservation } from './mockObservation'
import {
  deferredParallelGroupLoading,
  parallelGroupLoadFor,
} from './parallelGroupFixtures'
import { workflowEditorLoadFor } from './workflowEditorFixtures'
import { workflowExecutionLoadFor } from './workflowExecutionFixtures'
import { workflowRunLoadFor } from './workflowRunFixtures'
import type { MockEngineObserveOptions } from './mockEngineObserve'

export function mockObserveWorkflowListSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observeWorkflowRun(
      workflowId: WorkflowId,
      onUpdate: (load: import('../../model').WorkflowRunContextLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.workflowRuns,
        workflowId,
        onUpdate,
        (id) => workflowRunLoadFor(id),
      )
    },
    observeWorkflowEditor(
      workflowId: WorkflowId,
      onUpdate: (load: WorkflowEditorLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.workflowEditors,
        workflowId,
        onUpdate,
        (id): WorkflowEditorLoad => {
          const scenario = getScenario()
          if (scenario.workflowEditors === 'defer') {
            return { kind: 'loading' }
          }
          return workflowEditorLoadFor(id)
        },
      )
    },
  }
}

export function mockObserveWorkflowRunSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observeWorkflowExecution(
      runId: import('../../model').WorkflowRunId,
      onUpdate: (load: WorkflowRunLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.workflowExecutions,
        runId,
        onUpdate,
        (id): WorkflowRunLoad => {
          const scenario = getScenario()
          if (scenario.workflowExecutions === 'defer') {
            return { kind: 'loading' }
          }
          return workflowExecutionLoadFor(id)
        },
      )
    },
    observeParallelGroup(
      groupId: ParallelGroupId,
      onUpdate: (load: ParallelGroupLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.parallelGroups,
        groupId,
        onUpdate,
        (id): ParallelGroupLoad => {
          const scenario = getScenario()
          if (scenario.parallelGroups === 'defer') {
            return deferredParallelGroupLoading(id)
          }
          return parallelGroupLoadFor(id)
        },
      )
    },
  }
}