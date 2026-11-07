import type { WorkflowId, WorkflowNodeId, WorkflowRunId } from './ids'
import type { InlineRun } from './task'
import type { WorkflowNodeFrame } from './workflowEditor'

/**
 * A running workflow observation.
 * runId is not a workflow definition id. The launch form stays on WorkflowId.
 */

export type WorkflowRunNodeStatus = 'done' | 'needs-you' | 'pending' | 'idle'

export type WorkflowRunNode = {
  readonly id: WorkflowNodeId
  readonly placement: 'path' | 'standalone'
  readonly title: string
  readonly kindLabel: string
  readonly meta: string
  readonly status: WorkflowRunNodeStatus
  readonly frame: WorkflowNodeFrame | null
}

export type WorkflowRunEdge = {
  readonly id: string
  readonly from: WorkflowNodeId
  readonly to: WorkflowNodeId
  readonly active: boolean
}

export type WorkflowRunTool = {
  readonly id: string
  readonly summary: string
  readonly duration: string
  readonly output: string | null
}

export type WorkflowRunApproval = {
  readonly title: string
  readonly source: string
  readonly body: string
  readonly command: string
  readonly access: string
}

export type WorkflowRunDetail = {
  readonly title: string
  readonly statusLabel: string
  readonly goal: string
  readonly assessment: string
  readonly agent: string
  readonly message: string
  readonly tools: readonly WorkflowRunTool[]
  readonly approval: WorkflowRunApproval
}

/** One recorded call label. Rows are not a selection control. */
export type WorkflowRunCallRow = {
  readonly id: string
  readonly label: string
  readonly highlighted: boolean
}

/** The one call body recorded for an on-demand node. */
export type WorkflowRunOnDemandCall = {
  readonly id: string
  readonly caption: string
  readonly userMessage: string
  readonly agentRuns: readonly InlineRun[]
  readonly tool: WorkflowRunTool
  readonly result: string
}

/**
 * Read-only call inspector for one standalone node on this run.
 * nodeId must be that node's id. Another node's inspector is not a fallback.
 */
export type WorkflowRunOnDemand = {
  readonly nodeId: WorkflowNodeId
  readonly title: string
  readonly caption: string
  readonly introduction: string
  readonly calls: readonly WorkflowRunCallRow[]
  readonly call: WorkflowRunOnDemandCall
}

/** Lane status for the read-only Parallel run view. */
export type WorkflowRunLaneStatus = 'done' | 'running' | 'pending'

/** One body block inside a Parallel lane. */
export type WorkflowRunLaneBlock =
  | { readonly kind: 'agent'; readonly runs: readonly InlineRun[] }
  | {
      readonly kind: 'tool'
      readonly id: string
      readonly summary: string
      readonly duration: string
    }
  | { readonly kind: 'result'; readonly text: string }
  | { readonly kind: 'working'; readonly text: string }
  | {
      readonly kind: 'waiting'
      readonly title: string
      readonly caption: string
    }

/**
 * One Parallel lane for this run.
 * Lane ids are observation facts for this run, not graph node ids.
 */
export type WorkflowRunLane = {
  readonly id: string
  readonly title: string
  readonly agentLabel: string
  readonly status: WorkflowRunLaneStatus
  readonly statusMeta: string
  readonly composerName: string
  readonly blocks: readonly WorkflowRunLaneBlock[]
}

/**
 * Parallel observation for this run.
 * Null or empty lanes means Parallel is unavailable.
 */
export type WorkflowRunParallel = {
  readonly lanes: readonly WorkflowRunLane[]
  readonly workingLabel: string
  readonly decisionAttemptsLabel: string
}

export type WorkflowRunObservation = {
  readonly runId: WorkflowRunId
  readonly definitionId: WorkflowId
  readonly title: string
  readonly statusLabel: string
  readonly progressLabel: string
  readonly graphLabel: string
  readonly boardWidth: number
  readonly boardHeight: number
  readonly nodes: readonly WorkflowRunNode[]
  readonly edges: readonly WorkflowRunEdge[]
  readonly selectedNodeId: WorkflowNodeId
  readonly detail: WorkflowRunDetail
  readonly onDemand: readonly WorkflowRunOnDemand[]
  /** Parallel lanes and footer for this run. Null or empty lanes means unavailable. */
  readonly parallel: WorkflowRunParallel | null
}

export type WorkflowRunLoad =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unavailable'; readonly message: string }
  | { readonly kind: 'ready'; readonly run: WorkflowRunObservation }

export const WORKFLOW_RUN_UNAVAILABLE = 'This workflow run is unavailable.'
