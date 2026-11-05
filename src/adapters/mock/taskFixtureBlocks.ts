/**
 * Literal transcript block builders for mock running-task fixtures.
 * Presentation evidence only — not a public ctl transcript protocol.
 */
import type { InlineRun, TranscriptBlock } from '../../model'

function t(value: string): InlineRun {
  return { kind: 'text', value }
}

function c(value: string): InlineRun {
  return { kind: 'code', value }
}

function slotReleaseOpening(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'user',
      id: 'u1',
      text: 'The test_release_frees_slot test in tests/test_slots.py fails about one run in ten. Find out why and fix it without adding sleeps.',
    },
    {
      kind: 'agent',
      id: 'a1',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t(
              "I'll start with the slot release path and the test, then look for a race between the release call and the waiter being woken.",
            ),
          ],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-read',
      icon: 'file',
      summary: [{ kind: 'text', value: 'Read 4 files' }],
      meta: '0:06',
      bodyLines: null,
      initiallyExpanded: false,
    },
  ]
}

function slotReleaseDiagnosis(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'agent',
      id: 'a2',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t('Found a likely cause. '),
            c('SlotPool.release()'),
            t(' in '),
            c('harflow_mcp/slots.py'),
            t(
              ' sets the slot free and then notifies waiters outside the lock, so a waiter can wake, see the old count and go back to sleep. The test only passes when the notification lands first.',
            ),
          ],
        },
        {
          kind: 'paragraph',
          runs: [t("I'll reproduce it before changing anything.")],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-pytest',
      icon: 'terminal',
      summary: [
        { kind: 'text', value: 'Ran ' },
        {
          kind: 'code',
          value: 'pytest tests/test_slots.py -k release --count 20',
        },
      ],
      meta: '0:41',
      bodyLines: [
        {
          failedLead: true,
          text: 'FAILED tests/test_slots.py::test_release_frees_slot[7] - AssertionError: waiter still blocked',
        },
        {
          failedLead: true,
          text: 'FAILED tests/test_slots.py::test_release_frees_slot[15] - AssertionError: waiter still blocked',
        },
        {
          failedLead: false,
          text: '2 failed, 18 passed in 38.52s',
        },
      ],
      initiallyExpanded: true,
    },
  ]
}

function slotReleaseFix(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'agent',
      id: 'a3',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t(
              'Reproduced: 2 failures in 20 runs. The fix is to update the count and notify under the same lock:',
            ),
          ],
        },
        {
          kind: 'list',
          items: [
            [
              t('move '),
              c('notify_all()'),
              t(' inside the '),
              c('with self._lock'),
              t(' block'),
            ],
            [
              t(
                're-check the free count in the waiter loop instead of trusting the wake-up',
              ),
            ],
          ],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-edit',
      icon: 'pencil',
      summary: [
        { kind: 'text', value: 'Edited ' },
        { kind: 'code', value: 'harflow_mcp/slots.py' },
        { kind: 'text', value: ' ' },
        { kind: 'added', value: '+18' },
        { kind: 'text', value: ' ' },
        { kind: 'removed', value: '−6' },
      ],
      meta: '0:12',
      bodyLines: null,
      initiallyExpanded: false,
    },
    {
      kind: 'working',
      id: 'w1',
      label: 'Running tests…',
    },
  ]
}

export function slotReleaseBlocks(): readonly TranscriptBlock[] {
  return [
    ...slotReleaseOpening(),
    ...slotReleaseDiagnosis(),
    ...slotReleaseFix(),
  ]
}

export function preloadBlocks(): readonly TranscriptBlock[] {
  return [
    {
      kind: 'user',
      id: 'u1',
      text: 'Review the Electron preload bridge for authority gaps.\nInclude notes on <script>alert("x")</script> as literal text — do not execute.',
    },
    {
      kind: 'agent',
      id: 'a1',
      segments: [
        {
          kind: 'paragraph',
          runs: [
            t('Checking the preload surface. Literal probe: '),
            c('<img src=x onerror=alert(1)>'),
            t(' stays text-only.'),
          ],
        },
      ],
    },
    {
      kind: 'tool',
      id: 'tool-read-preload',
      icon: 'file',
      summary: [{ kind: 'text', value: 'Read 2 files' }],
      meta: '0:03',
      bodyLines: [
        { failedLead: false, text: 'preload.ts' },
        { failedLead: false, text: 'bridge.ts' },
      ],
      initiallyExpanded: false,
    },
    {
      kind: 'working',
      id: 'w1',
      label: 'Reading bridge contracts…',
    },
  ]
}
