/**
 * Literal completed-task transcript + summary from HarflowDesign task/done.
 * Fixture evidence only — not verified change/artifact/authorship claims.
 */
import type { InlineRun, TaskSummary, TranscriptBlock } from '../../model'

function t(value: string): InlineRun {
  return { kind: 'text', value }
}

function c(value: string): InlineRun {
  return { kind: 'code', value }
}

function retryBudgetOpening(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'user',
      id: 'u1',
      text: 'Add a retry budget to the delivery queue so a failing webhook stops after 5 attempts per hour instead of retrying forever.',
    },
    {
      kind: 'agent',
      id: 'a1',
      segments: [
        {
          kind: 'paragraph',
          runs: [t("I'll read the delivery queue and its tests first.")],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-read-queue',
      icon: 'file',
      summary: [{ kind: 'text', value: 'Read 6 files' }],
      meta: '0:09',
      bodyLines: null,
      initiallyExpanded: false,
    },
  ]
}

function retryBudgetEdits(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'tool',
      id: 'tool-edit-queue',
      icon: 'pencil',
      summary: [
        { kind: 'text', value: 'Edited ' },
        c('harflow_web/delivery/queue.py'),
        { kind: 'text', value: ' ' },
        { kind: 'added', value: '+24' },
        { kind: 'text', value: ' ' },
        { kind: 'removed', value: '−3' },
      ],
      meta: '0:20',
      bodyLines: null,
      initiallyExpanded: false,
    },
    {
      kind: 'tool',
      id: 'tool-edit-tests',
      icon: 'pencil',
      summary: [
        { kind: 'text', value: 'Edited ' },
        c('tests/test_delivery_queue.py'),
        { kind: 'text', value: ' ' },
        { kind: 'added', value: '+31' },
      ],
      meta: '0:14',
      bodyLines: null,
      initiallyExpanded: false,
    },
    {
      kind: 'tool',
      id: 'tool-pytest-queue',
      icon: 'terminal',
      summary: [
        { kind: 'text', value: 'Ran ' },
        c('pytest tests/test_delivery_queue.py'),
      ],
      meta: '0:27',
      bodyLines: [
        {
          boldPrefix: 'tests/test_delivery_queue.py',
          text: 'tests/test_delivery_queue.py ........... [100%]',
        },
        {
          boldPrefix: null,
          text: '11 passed in 2.04s',
        },
      ],
      initiallyExpanded: true,
    },
  ]
}

export function retryBudgetCompletedBlocks(): readonly TranscriptBlock[] {
  return [...retryBudgetOpening(), ...retryBudgetEdits()]
}

export function retryBudgetSummary(): TaskSummary {
  return {
    heading: 'Summary',
    segments: [
      {
        kind: 'paragraph',
        runs: [
          t(
            'Deliveries now have a retry budget of 5 attempts per hour per target. When the budget is spent, the delivery is marked ',
          ),
          c('exhausted'),
          t(' and is no longer retried until the window resets.'),
        ],
      },
      {
        kind: 'list',
        items: [
          [
            c('queue.py'),
            t(' tracks attempts in a sliding window per target.'),
          ],
          [
            t('The budget is configurable through '),
            c('HARFLOW_DELIVERY_RETRY_BUDGET'),
            t('.'),
          ],
          [
            t(
              'Three new tests cover the limit, the reset and the config override. All 11 tests pass.',
            ),
          ],
        ],
      },
    ],
  }
}
