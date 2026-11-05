import type { SidebarGlyph } from '../model'
import { Icon } from './Icon'

type Props = {
  readonly glyph: SidebarGlyph
  readonly label: string
}

export function Glyph({ glyph, label }: Props) {
  if (glyph === 'running') {
    return <span className="hd-glyph hd-glyph--running" aria-label={label} />
  }
  if (glyph === 'parallel') {
    return (
      <span className="hd-glyph hd-glyph--active" aria-label={label}>
        <Icon name="parallel" size="sm" />
      </span>
    )
  }
  if (glyph === 'attention') {
    return (
      <span className="hd-glyph hd-glyph--attention" aria-label={label}>
        <Icon name="hand" size="sm" />
      </span>
    )
  }
  if (glyph === 'done') {
    return (
      <span className="hd-glyph hd-glyph--done" aria-label={label}>
        <Icon name="check" size="sm" />
      </span>
    )
  }
  if (glyph === 'failed') {
    return (
      <span className="hd-glyph hd-glyph--failed" aria-label={label}>
        <Icon name="x" size="sm" />
      </span>
    )
  }
  if (glyph === 'cancelled') {
    return (
      <span className="hd-glyph hd-glyph--cancelled" aria-label={label}>
        <Icon name="stop" size="sm" />
      </span>
    )
  }
  return (
    <span className="hd-glyph hd-glyph--done" aria-label={label}>
      <Icon name="workflow" size="sm" />
    </span>
  )
}
