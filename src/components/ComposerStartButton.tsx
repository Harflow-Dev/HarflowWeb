import { Icon } from './Icon'

type Props = {
  readonly canSubmit: boolean
  readonly pending?: boolean
  readonly blockedReason?: string | null
}

/**
 * Round Start control. While a start is in flight the accessible name is
 * "Starting task" (Design `new-task/centered-starting-plain`, 76ad937).
 */
export function ComposerStartButton({
  canSubmit,
  pending = false,
  blockedReason = null,
}: Props) {
  const explain = !canSubmit && !pending && blockedReason ? blockedReason : null
  return (
    <button
      type="submit"
      className="hd-composer__send"
      aria-label={pending ? 'Starting task' : 'Start task'}
      disabled={!canSubmit}
      title={explain ?? undefined}
      aria-description={explain ?? undefined}
    >
      <Icon name="arrow-up" />
    </button>
  )
}
