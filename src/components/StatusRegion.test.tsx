import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import appCss from '../styles/app.css?raw'
import { StatusRegion } from './StatusRegion'

const IDLE = { kind: 'idle' } as const

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('style[data-test]').forEach((n) => n.remove())
})

function withAppCss(): void {
  const style = document.createElement('style')
  style.setAttribute('data-test', 'app-css')
  style.textContent = appCss
  document.head.appendChild(style)
}

describe('StatusRegion', () => {
  it('draws no visible box while it has no text, yet stays mounted', () => {
    withAppCss()
    render(
      <StatusRegion submission={IDLE} contextNote={null} unavailableNav={null} />,
    )
    const region = screen.getByRole('status')
    expect(region).toHaveClass('hw-status--empty')
    const box = getComputedStyle(region)
    expect(box.width).toBe('1px')
    expect(box.height).toBe('1px')
    expect(box.padding).toBe('0px')
    expect(box.borderTopWidth).toBe('0px')
    expect(box.display).not.toBe('none')
  })

  it('announces text that arrives later in the same element', () => {
    withAppCss()
    const { rerender } = render(
      <StatusRegion submission={IDLE} contextNote={null} unavailableNav={null} />,
    )
    const region = screen.getByRole('status')
    rerender(
      <StatusRegion
        submission={IDLE}
        contextNote={null}
        unavailableNav={null}
        announceNote="Copied"
        noteNonce={1}
      />,
    )
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Copied')
    expect(region).not.toHaveClass('hw-status--empty')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(getComputedStyle(region).width).not.toBe('1px')
  })
})
