/**
 * One Nightly publish request for Needs you and the run detail.
 *
 * HarflowDesign 3643d083700be4032c93237813b573d04bab6ab1 has two specimens.
 * needs-you/waiting (`v2/scripts/screens-needs-you.js`) is the mapped request:
 * branch deps/audit-2026-11-03, Codex · gpt-6-astra, repository HarflowMCP,
 * and “Push branch … in HarflowMCP”.
 * workflow-run/graph-needs-you (`v2/scripts/screens-workflow-run.js`) used
 * branch audit/2026-11-03, Codex · gpt-6, approval source “Codex · Worker”,
 * and “on HarflowMCP”. Those four facts are adapted to this request.
 * Graph node roles stay “Claude · Worker” and “Codex · Worker”.
 * The command remote Harflow-Dev/HarflowMCP and title “Upgrade 3 dependencies”
 * stay the graph specimen’s slug and title for this same repository.
 * Each surface keeps its own Can publish sentence.
 */

export const NIGHTLY_PUBLISH_SNAPSHOT = {
  branch: 'deps/audit-2026-11-03',
  requester: 'Codex',
  model: 'gpt-6-astra',
  repository: 'HarflowMCP',
  remote: 'Harflow-Dev/HarflowMCP',
  pullRequestTitle: 'Upgrade 3 dependencies',
  publishAction:
    'Push branch deps/audit-2026-11-03 and open a pull request in HarflowMCP',
  needsYouAccess: 'Needs Can publish access',
  runAccess: 'Requires the access level Can publish.',
} as const

export const NIGHTLY_REQUESTER_MODEL =
  `${NIGHTLY_PUBLISH_SNAPSHOT.requester} · ${NIGHTLY_PUBLISH_SNAPSHOT.model}` as const
