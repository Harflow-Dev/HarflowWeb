import type { HarnessId, HarnessOption, ModelId } from '../model'

const HINT_ID = 'm04-harness-hint'

type Props = {
  readonly harnesses: readonly HarnessOption[]
  readonly selectedHarnessId: HarnessId | null
  readonly selectedModelId: ModelId | null
  readonly qualificationHint: string | null
  readonly disabled: boolean
  readonly onSelectHarness: (id: HarnessId) => void
  readonly onSelectModel: (id: ModelId) => void
}

function HarnessSelect(props: {
  readonly harnesses: readonly HarnessOption[]
  readonly value: string
  readonly disabled: boolean
  readonly describedBy: string | undefined
  readonly onSelect: (id: HarnessId) => void
}) {
  return (
    <select
      value={props.value}
      disabled={props.disabled}
      aria-describedby={props.describedBy}
      onChange={(event) => {
        const id = event.target.value as HarnessId
        const next = props.harnesses.find((h) => h.id === id)
        if (next === undefined || !next.available) return
        props.onSelect(id)
      }}
    >
      {props.harnesses.map((item) => (
        <option key={item.id} value={item.id} disabled={!item.available}>
          {item.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Centered harness picker body (Design 854caae): labelled Harness and Model
 * selects. Unavailable harness stays disabled whenever present.
 */
export function ComposerHarnessFields(props: Props) {
  const selected =
    props.harnesses.find((h) => h.id === props.selectedHarnessId) ?? null
  const hint = props.qualificationHint
  return (
    <>
      <label className="hd-m04-menu-field">
        Harness
        <HarnessSelect
          harnesses={props.harnesses}
          value={props.selectedHarnessId ?? ''}
          disabled={props.disabled}
          describedBy={hint !== null ? HINT_ID : undefined}
          onSelect={props.onSelectHarness}
        />
        {hint !== null ? (
          <span className="hd-field__hint" id={HINT_ID}>
            {hint}
          </span>
        ) : null}
      </label>
      <label className="hd-m04-menu-field">
        Model
        <select
          value={props.selectedModelId ?? ''}
          disabled={props.disabled || selected === null}
          onChange={(event) => {
            props.onSelectModel(event.target.value as ModelId)
          }}
        >
          {(selected?.models ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
