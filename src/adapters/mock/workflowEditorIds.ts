import { asWorkflowId, asWorkflowNodeId } from '../../model'

export const EDITOR_RELEASE_ID = asWorkflowId('wf-release-checklist')
export const EDITOR_NIGHTLY_ID = asWorkflowId('wf-nightly-audit')
export const RELEASE_REVIEW_NODE_ID = asWorkflowNodeId('release-review')
export const NIGHTLY_AUDIT_NODE_ID = asWorkflowNodeId('nightly-audit')
