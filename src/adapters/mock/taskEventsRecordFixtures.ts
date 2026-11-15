/**
 * Stored event records — exact JSON text from Design 6e31cd7 (EVENTS map),
 * plus a builder for other tasks' history. Mock-only — not a ctl protocol.
 */
import type { TaskEventsRecord } from '../../model'

function specimen(
  seq: number,
  kind: string,
  fields: string,
): TaskEventsRecord {
  return {
    seq,
    kind,
    json: `{
  "format": "harflow.event", "product": "harflow",
  "product_version": "0.0.11", "v": 1,
  "observed_at": "2026-10-14T17:46:40+00:00", "seq": ${seq},
  "kind": "${kind}", ${fields}
}`,
  }
}

export const TOOL_RESULT = specimen(
  5,
  'tool_result',
  '"call_id": "call-1",\n  "is_error": false, "output": "Readme body"',
)
export const ASSISTANT_START = specimen(
  40,
  'assistant_text',
  '"text": "Starting."',
)
export const ASSISTANT_DONE = specimen(41, 'assistant_text', '"text": "Done."')
export const TOOL_PASSED = specimen(
  42,
  'tool_result',
  '"call_id": "call-9",\n  "is_error": false, "output": "11 passed"',
)
export const STUB_FUTURE = specimen(43, 'future_kind', '"truncated": true')

function plain(seq: number, kind: string, body: Record<string, unknown>) {
  return {
    seq,
    kind,
    json: JSON.stringify(
      {
        format: 'harflow.event',
        product: 'harflow',
        product_version: '0.0.11',
        v: 1,
        observed_at: '2026-10-14T17:46:40+00:00',
        seq,
        kind,
        ...body,
      },
      null,
      2,
    ),
  }
}

/** exit_code agrees with status; cancelled and timed-out runs report none. */
function finishedFields(status: string): Record<string, unknown> {
  if (status === 'completed') return { exit_code: 0, status }
  if (status === 'failed') return { exit_code: 1, status }
  return { status }
}

/** A short history for a task without its own specimen. */
export function genericRecords(
  finishedStatus: string | null,
): readonly TaskEventsRecord[] {
  const records = [
    plain(1, 'assistant_text', { text: 'Looking at the code.' }),
    plain(2, 'tool_call', {
      call_id: 'call-1',
      tool: 'Read',
      input: { file_path: 'README.md' },
    }),
    plain(3, 'tool_result', {
      call_id: 'call-1',
      is_error: false,
      output: 'Readme body',
    }),
  ]
  if (finishedStatus === null) return records
  return [
    ...records,
    plain(4, 'task_finished', finishedFields(finishedStatus)),
  ]
}
