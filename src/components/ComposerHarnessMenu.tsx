import type { HarnessId, HarnessOption, ModelId } from '../model'
import { Icon } from './Icon'

export function HarnessChoice({
  item,
  selected,
  onSelect,
}: {
  readonly item: HarnessOption
  readonly selected: boolean
  readonly onSelect: (id: HarnessId) => void
}) {
  return (
    <button
      type="button"
      className="hd-menu__item"
      role="menuitem"
      disabled={!item.available}
      aria-disabled={!item.available}
      style={item.available ? undefined : { opacity: 0.5, cursor: 'default' }}
      onClick={() => {
        if (item.available) onSelect(item.id)
      }}
    >
      <Icon name="harness" />
      <span className="hd-menu__item-body">
        <span>{item.label}</span>
        <span className="hd-menu__item-hint">
          {item.available
            ? (item.models.find((m) => m.id === item.defaultModelId)?.label ??
              'Default model')
            : (item.unavailableReason ?? 'Unavailable')}
        </span>
      </span>
      {selected ? (
        <span className="hd-menu__check">
          <Icon name="check" />
        </span>
      ) : null}
    </button>
  )
}

export function ModelChoices({
  harness,
  selectedModelId,
  onSelectModel,
}: {
  readonly harness: HarnessOption
  readonly selectedModelId: ModelId | null
  readonly onSelectModel: (id: ModelId) => void
}) {
  return (
    <>
      <div className="hd-menu__sep" />
      <div className="hd-menu__label">Model for {harness.label}</div>
      {harness.models.map((item) => (
        <button
          key={item.id}
          type="button"
          className="hd-menu__item"
          role="menuitem"
          onClick={() => onSelectModel(item.id)}
        >
          <span className="hd-menu__item-body">
            <span>{item.label}</span>
          </span>
          {item.id === selectedModelId ? (
            <span className="hd-menu__check">
              <Icon name="check" />
            </span>
          ) : null}
        </button>
      ))}
    </>
  )
}
