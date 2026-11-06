type IconName =
  | 'plus'
  | 'hand'
  | 'workflow'
  | 'gauge'
  | 'chart'
  | 'sidebar'
  | 'settings'
  | 'monitor'
  | 'sun'
  | 'moon'
  | 'folder'
  | 'harness'
  | 'shield'
  | 'chevron-down'
  | 'chevron-right'
  | 'arrow-up'
  | 'arrow-left'
  | 'check'
  | 'x'
  | 'stop'
  | 'parallel'
  | 'eye'
  | 'pencil'
  | 'file'
  | 'terminal'
  | 'alert'
  | 'refresh'
  | 'copy'
  | 'external'
  | 'play'
  | 'panel-right'
  | 'more'

type Props = {
  readonly name: IconName
  readonly size?: 'sm' | 'md'
}

export function Icon({ name, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'hd-i--sm' : ''
  return (
    <span
      className={`hd-i ${sizeClass} hd-i-${name}`.trim()}
      aria-hidden="true"
    />
  )
}

export type { IconName }
