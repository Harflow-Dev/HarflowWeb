import { Icon } from './Icon'

type Props = {
  readonly canSubmit: boolean
}

/** Round Start control at the end of the composer bar. */
export function ComposerStartButton({ canSubmit }: Props) {
  return (
    <button
      type="submit"
      className="hd-composer__send"
      aria-label="Start task"
      disabled={!canSubmit}
    >
      <Icon name="arrow-up" />
    </button>
  )
}
