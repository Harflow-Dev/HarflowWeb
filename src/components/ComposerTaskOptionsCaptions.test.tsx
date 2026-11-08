import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ComposerTaskOptionsCaptions } from './ComposerTaskOptionsCaptions'

afterEach(() => {
  cleanup()
})

describe('ComposerTaskOptionsCaptions', () => {
  it.each([
    ['checking', 'Harness qualification: checking.'],
    ['unqualified', 'Harness qualification: unqualified.'],
    ['ready', 'Harness qualification: ready.'],
  ] as const)('shows %s from the observation', (qualification, expected) => {
    render(
      <ComposerTaskOptionsCaptions
        permissionPreview="Can edit this repo"
        qualification={qualification}
      />,
    )
    expect(screen.getByText(expected, { exact: false })).toHaveTextContent(
      expected,
    )
  })
})
