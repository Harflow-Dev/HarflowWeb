import { afterEach, describe, expect, it } from 'vitest'
import { focusDialogOpener } from './taskOverflowActions'

afterEach(() => {
  document.body.innerHTML = ''
})

function button(attached: boolean): HTMLButtonElement {
  const node = document.createElement('button')
  if (attached) document.body.appendChild(node)
  return node
}

describe('focusDialogOpener', () => {
  it('focuses the opener when it is still present', () => {
    const more = button(true)
    const composer = button(true)
    focusDialogOpener(
      'composer-stop',
      { current: more },
      { current: composer },
      { current: null },
    )
    expect(composer).toHaveFocus()
  })

  it('falls back to More when the opener is gone or disabled', () => {
    const more = button(true)
    focusDialogOpener(
      'banner-stop',
      { current: more },
      { current: null },
      { current: null },
    )
    expect(more).toHaveFocus()
    const composer = button(true)
    composer.disabled = true
    more.blur()
    focusDialogOpener(
      'composer-stop',
      { current: more },
      { current: composer },
      { current: null },
    )
    expect(more).toHaveFocus()
  })
})
