/**
 * M05 task conversations (HarflowDesign 6e31cd7 m05-proposal.js `TASKS` and
 * `transcript(kind)`). Text is copied from the design; fixture evidence only.
 */
import type {
  ConversationItem,
  ConversationOutputLine,
  InlineRun,
  TaskConversation,
} from '../../model'

const text = (value: string): InlineRun => ({ kind: 'text', value })
const code = (value: string): InlineRun => ({ kind: 'code', value })

function agent(...paragraphs: readonly (readonly InlineRun[])[]): ConversationItem {
  return { kind: 'agent', paragraphs }
}

function tool(
  kind: 'file' | 'pencil' | 'terminal',
  summary: readonly InlineRun[],
  output?: readonly ConversationOutputLine[],
): ConversationItem {
  return output ? { kind: 'tool', tool: kind, summary, output } : { kind: 'tool', tool: kind, summary }
}

export function runningConversation(): TaskConversation {
  return {
    request:
      'The test_release_frees_slot test in tests/test_slots.py fails about one run in ten. Find out why and fix it without adding sleeps.',
    items: [
      agent([
        text(
          "I'll start with the slot release path and the test, then look for a race between the release call and the waiter being woken.",
        ),
      ]),
      tool('file', [text('Read 4 files')]),
      agent([
        text('Found a likely cause. '),
        code('SlotPool.release()'),
        text(
          ' sets the slot free and notifies waiters outside the lock, so a waiter can wake, see the old count and go back to sleep.',
        ),
      ]),
      tool(
        'terminal',
        [text('Ran '), code('pytest tests/test_slots.py -k release --count 20')],
        [
          {
            marker: 'FAILED',
            text: ' tests/test_slots.py::test_release_frees_slot[7]',
          },
          {
            marker: 'FAILED',
            text: ' tests/test_slots.py::test_release_frees_slot[15]',
          },
          { text: '2 failed, 18 passed' },
        ],
      ),
      tool('pencil', [text('Edited '), code('harflow_mcp/slots.py')]),
      { kind: 'working', label: 'Running tests…' },
    ],
  }
}

export function failedConversation(): TaskConversation {
  return {
    request:
      'Move the events.jsonl reader to the streaming parser and keep reading partially written trailing lines.',
    items: [
      agent([
        text("I'll look at how the reader is used before swapping the parser."),
      ]),
      tool('file', [text('Read 5 files')]),
      tool('pencil', [text('Edited '), code('harflow_mcp/events/reader.py')]),
      tool(
        'terminal',
        [text('Ran '), code('pytest tests/test_events_reader.py')],
        [
          {
            marker: 'FAILED',
            text: ' tests/test_events_reader.py::test_partial_trailing_line',
          },
          { text: '1 failed, 14 passed' },
        ],
      ),
    ],
  }
}

export function doneConversation(): TaskConversation {
  return {
    request:
      'Add a retry budget to the delivery queue so a failing webhook stops after 5 attempts per hour instead of retrying forever.',
    items: [
      agent([text("I'll read the delivery queue and its tests first.")]),
      tool('file', [text('Read 6 files')]),
      tool('pencil', [text('Edited '), code('harflow_web/delivery/queue.py')]),
      tool(
        'terminal',
        [text('Ran '), code('pytest tests/test_delivery_queue.py')],
        [{ text: '11 passed' }],
      ),
      { kind: 'separator', label: 'Summary' },
      agent([
        text(
          'Deliveries now have a retry budget of 5 attempts per hour per target. When the budget is spent, the delivery is marked ',
        ),
        code('exhausted'),
        text('.'),
      ]),
    ],
  }
}

export function stoppedConversation(): TaskConversation {
  return {
    request:
      'Trace the composer during a streaming run and list what runs on each keystroke.',
    items: [
      agent([
        text(
          "I'll record a streaming run and compare keystroke handling with and without activity.",
        ),
      ]),
      tool('terminal', [
        text('Ran '),
        code('swift test --filter ComposerLatencyTests'),
      ]),
      agent([
        text(
          "Layout runs on every keystroke while rows are arriving. I'm tracing which input changes.",
        ),
      ]),
    ],
  }
}
