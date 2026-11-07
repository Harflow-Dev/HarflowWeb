import { forwardRef, type MouseEvent } from 'react'
import { Icon } from './Icon'

type Props = {
  readonly open: boolean
  readonly customized: boolean
  readonly locked: boolean
  readonly optionsId: string
  readonly descriptionId: string
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/** Plus button that opens Task options. */
export const ComposerTaskOptionsTrigger = forwardRef<
  HTMLButtonElement,
  Props
>(function ComposerTaskOptionsTrigger(props, ref) {
  return (
    <button
      type="button"
      ref={ref}
      className="hd-btn hd-btn--icon hw-options-trigger"
      aria-label="More task options"
      title="More task options"
      aria-expanded={props.open}
      aria-controls={props.optionsId}
      aria-describedby={props.descriptionId}
      disabled={props.locked}
      onClick={props.onClick}
    >
      <Icon name="plus" />
      <span className="hw-options-dot" hidden={!props.customized} aria-hidden="true" />
      <span className="hd-sr" id={props.descriptionId}>
        {props.customized ? 'Customized options' : 'Default options'}
      </span>
    </button>
  )
})
