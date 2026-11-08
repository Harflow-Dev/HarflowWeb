import { asTaskId } from '../../model'
import { emptySidebar, partialSidebar } from './fixtures'
import { emptyNeedsYouLoad } from './needsYouFixtures'
import { accepted, base, readyContext } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'
import { statisticsLoadFor } from './statisticsFixtures'
import { taskLoadFor } from './taskFixtures'
import { emptyWorkflowsLoad } from './workflowFixtures'

export const SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'populated',
    label: 'Populated',
    description: 'New-task, workflows, resources, and statistics fixtures.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'empty-sidebar',
    label: 'Empty sidebar',
    description: 'Composer ready; Running and Recent empty.',
    context: readyContext(emptySidebar()),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'loading',
    label: 'Context loading',
    description: 'Proposal status: loading — no approved specimen.',
    context: { kind: 'loading' },
    startOutcome: {
      kind: 'refused',
      code: 'unavailable',
      reason: 'Context is still loading.',
    },
    holdStart: false,
  }),
  base({
    id: 'unavailable',
    label: 'Context unavailable',
    description: 'Proposal status: unavailable — no approved specimen.',
    context: {
      kind: 'unavailable',
      message: 'Mock engine context is unavailable.',
    },
    startOutcome: {
      kind: 'refused',
      code: 'unavailable',
      reason: 'Context unavailable.',
    },
    holdStart: false,
  }),
  base({
    id: 'partial-sidebar',
    label: 'Partial sidebar',
    description: 'Incomplete coverage marked explicitly (proposal).',
    context: readyContext(partialSidebar()),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'submit-accepted',
    label: 'Submit accepted',
    description: 'Maps to ctl-launch-run-accepted.json semantics.',
    context: readyContext(),
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-fixture'),
    },
    holdStart: false,
  }),
  base({
    id: 'submit-refused',
    label: 'Submit refused',
    description: 'Maps to ctl-launch-run-refused.json semantics.',
    context: readyContext(),
    startOutcome: {
      kind: 'refused',
      code: 'invalid_params',
      reason: 'fixture refusal',
    },
    holdStart: false,
  }),
  base({
    id: 'submit-unknown',
    label: 'Submit unknown',
    description: 'Maps to ctl-launch-run-unknown.json; no automatic retry.',
    context: readyContext(),
    startOutcome: {
      kind: 'unknown',
      message: 'fixture: owner did not report; a task may exist',
    },
    holdStart: false,
  }),
  base({
    id: 'stale-response',
    label: 'Stale response',
    description:
      'Holds start; resolve after remount/disposal so the late accept is ignored.',
    context: readyContext(),
    startOutcome: {
      kind: 'accepted',
      taskId: asTaskId('task-stale'),
    },
    holdStart: true,
  }),
  base({
    id: 'workflows-populated',
    label: 'Workflows list',
    description: 'Approved workflows/list specimen data.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'workflows-empty',
    label: 'Workflows empty',
    description: 'Approved workflows/empty specimen data.',
    context: readyContext(),
    workflows: emptyWorkflowsLoad(),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'resources-slots',
    label: 'Resources slots',
    description: 'Approved resources/slots specimen data.',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'statistics-overview',
    label: 'Statistics overview',
    description: 'Approved statistics/overview specimen ranges (7d + 30d).',
    context: readyContext(),
    statistics: (range) => statisticsLoadFor(range),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'task-running',
    label: 'Task running',
    description: 'Approved task/running transcript for mapped sidebar rows.',
    context: readyContext(),
    tasks: (taskId) => taskLoadFor(taskId),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'task-failed',
    label: 'Task failed',
    description: 'Approved task/failed transcript for the mapped recent row.',
    context: readyContext(),
    tasks: (taskId) => taskLoadFor(taskId),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'task-done',
    label: 'Task done',
    description:
      'Approved task/done transcript+summary with read-only Changes pane.',
    context: readyContext(),
    tasks: (taskId) => taskLoadFor(taskId),
    startOutcome: accepted,
    holdStart: false,
  }),
  base({
    id: 'needs-you-empty',
    label: 'Needs you empty',
    description:
      'Approved needs-you/empty specimen. Complete coverage and zero requests.',
    context: readyContext(),
    needsYou: emptyNeedsYouLoad(),
    startOutcome: accepted,
    holdStart: false,
  }),
]
