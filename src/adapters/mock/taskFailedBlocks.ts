/**
 * Literal failed-task transcript blocks from HarflowDesign task/failed.
 * Presentation evidence only — not a public ctl transcript protocol.
 */
import type { InlineRun, TranscriptBlock } from '../../model'

function t(value: string): InlineRun {
  return { kind: 'text', value }
}

function c(value: string): InlineRun {
  return { kind: 'code', value }
}

function eventsReaderOpening(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'user',
      id: 'u1',
      text: 'Move the events.jsonl reader to the streaming parser and keep reading partially written trailing lines.',
    },
    {
      kind: 'agent',
      id: 'a1',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t("I'll look at how the reader is used before swapping the parser."),
          ],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-read-events',
      icon: 'file',
      summary: [{ kind: 'text', value: 'Read 5 files' }],
      meta: '0:08',
      bodyLines: null,
      initiallyExpanded: false,
    },
    {
      kind: 'tool',
      id: 'tool-edit-events',
      icon: 'pencil',
      summary: [
        { kind: 'text', value: 'Edited ' },
        c('harflow_mcp/events/reader.py'),
        { kind: 'text', value: ' ' },
        { kind: 'added', value: '+42' },
        { kind: 'text', value: ' ' },
        { kind: 'removed', value: '−19' },
      ],
      meta: '0:31',
      bodyLines: null,
      initiallyExpanded: false,
    },
  ]
}

function eventsReaderClosing(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'agent',
      id: 'a2',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t(
              'The reader now yields events lazily and holds back an incomplete trailing line until the next read. Running the events tests to confirm.',
            ),
          ],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-pytest-events',
      icon: 'terminal',
      summary: [
        { kind: 'text', value: 'Ran ' },
        c('pytest tests/test_events_reader.py'),
      ],
      meta: '0:19',
      bodyLines: [
        {
          failedLead: true,
          text: 'FAILED tests/test_events_reader.py::test_partial_trailing_line',
        },
        {
          failedLead: false,
          text: 'E   json.decoder.JSONDecodeError: Unterminated string starting at: line 1 column 38',
        },
        {
          failedLead: false,
          text: '1 failed, 14 passed in 1.77s',
        },
      ],
      initiallyExpanded: true,
    },
  ]
}

export function eventsReaderFailedBlocks(): readonly TranscriptBlock[] {
  return [...eventsReaderOpening(), ...eventsReaderClosing()]
}
