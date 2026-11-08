import { Icon } from './Icon'

type Props = {
  readonly canSubmit: boolean
  readonly blockedReason?: string | null
}

/** Round Start control at the end of the composer bar. */
export function ComposerStartButton({ canSubmit, blockedReason = null }: Props) {
  return (
    <button
      type="submit"
      className="hd-composer__send"
      aria-label="Start task"
      disabled={!canSubmit}
      title={!canSubmit && blockedReason ? blockedReason : undefined}
      aria-description={
        !canSubmit && blockedReason ? blockedReason : undefined
      }
    >
      <Icon name="arrow-up" />
    </button>
  )
}
