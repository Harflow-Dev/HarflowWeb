import type { TaskSummary } from '../../model'

/** Completed-task summary from HarflowDesign task/done (fixture evidence only). */
export function retryBudgetSummary(): TaskSummary {
  return {
    heading: 'Summary',
    segments: [
      {
        kind: 'paragraph',
        runs: [
          {
            kind: 'text',
            value:
              'Deliveries now have a retry budget of 5 attempts per hour per target. When the budget is spent, the delivery is marked ',
          },
          { kind: 'code', value: 'exhausted' },
          {
            kind: 'text',
            value:
              ' and is no longer retried until the window resets.',
          },
        ],
      },
      {
        kind: 'list',
        items: [
          [
            { kind: 'code', value: 'queue.py' },
            {
              kind: 'text',
              value: ' tracks attempts in a sliding window per target.',
            },
          ],
          [
            { kind: 'text', value: 'The budget is configurable through ' },
            { kind: 'code', value: 'HARFLOW_DELIVERY_RETRY_BUDGET' },
            { kind: 'text', value: '.' },
          ],
          [
            {
              kind: 'text',
              value:
                'Three new tests cover the limit, the reset and the config override. All 11 tests pass.',
            },
          ],
        ],
      },
    ],
  }
}
