import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { TranscriptBlock } from '../model'
import { TaskTranscript } from './TaskTranscript'

afterEach(() => {
  cleanup()
})

describe('TaskTranscript', () => {
  it('renders multiline Unicode and HTML-like text as literal text nodes', () => {
    const blocks: TranscriptBlock[] = [
      {
        kind: 'user',
        id: 'u',
        text: 'Line one\nLine two with <script>alert("x")</script> and café — 日本語',
      },
      {
        kind: 'agent',
        id: 'a',
        segments: [
          {
            kind: 'paragraph',
            runs: [
              { kind: 'text', value: 'Probe: ' },
              { kind: 'code', value: '<img src=x onerror=alert(1)>' },
            ],
          },
        ],
      },
    ]
    const { container } = render(<TaskTranscript blocks={blocks} />)
    const user = container.querySelector('.hd-msg-user')
    expect(user?.textContent).toBe(
      'Line one\nLine two with <script>alert("x")</script> and café — 日本語',
    )
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.innerHTML).toContain('&lt;script&gt;')
  })

  it('toggles expandable tool bodies from the disclosure button', async () => {
    const user = userEvent.setup()
    const blocks: TranscriptBlock[] = [
      {
        kind: 'tool',
        id: 'tool-1',
        icon: 'terminal',
        summary: [{ kind: 'text', value: 'Ran probe' }],
        meta: '0:01',
        bodyLines: [{ failedLead: false, text: 'body-secret-line' }],
        initiallyExpanded: false,
      },
    ]
    render(<TaskTranscript blocks={blocks} />)
    const button = screen.getByRole('button', { name: /Ran probe/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('body-secret-line')).not.toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('body-secret-line')).toBeInTheDocument()

    button.focus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('body-secret-line')).not.toBeInTheDocument()
  })
})
