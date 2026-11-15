import type { TaskTopbarChip } from '../presentation/taskTopbarChips'
import { Icon } from './Icon'

type Props = {
  readonly chips: readonly TaskTopbarChip[]
  readonly onReveal: (id: TaskTopbarChip['id']) => void
}

/** Access / notices / continuity chips that open Events facts groups. */
export function TaskTopbarChips({ chips, onReveal }: Props) {
  if (chips.length === 0) return null
  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="hd-m05-chip"
          title={chip.ariaLabel}
          aria-label={chip.ariaLabel}
          onClick={() => onReveal(chip.id)}
        >
          <Icon name={chip.icon} size="sm" />
          {chip.label !== null ? (
            <span className="hd-m05-chip__label hd-m05-chip__label--wide">
              {chip.label}
            </span>
          ) : null}
          {chip.narrowLabel !== null ? (
            <span className="hd-m05-chip__label hd-m05-chip__label--narrow">
              {chip.narrowLabel}
            </span>
          ) : null}
        </button>
      ))}
    </>
  )
}
