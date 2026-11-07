import { useRef } from 'react'
import type { ApprovalsMode, EffortLevel } from '../presentation/taskOptions'
import { ComposerTaskOptionsFields } from './ComposerTaskOptionsFields'
import { ComposerTaskOptionsTrigger } from './ComposerTaskOptionsTrigger'
import {
  useTaskOptionsDismiss,
  useTaskOptionsPlacement,
} from './useTaskOptionsChrome'
import { useFocusFirstOption } from './useFocusFirstOption'

const OPTIONS_ID = 'hw-task-options'
const DESC_ID = 'hw-options-description'

type Props = {
  readonly open: boolean
  readonly customized: boolean
  readonly locked: boolean
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
  readonly effortOptions: readonly EffortLevel[]
  readonly permissionPreview: string
  readonly onToggle: () => void
  readonly onClose: (focusTrigger: boolean) => void
  readonly onEffort: (value: EffortLevel) => void
  readonly onTurns: (value: string) => void
  readonly onApprovals: (value: ApprovalsMode) => void
}

/** Bottom-left + control and Task options popover from the M04 specimen. */
export function ComposerTaskOptions(props: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const focusFirstRef = useFocusFirstOption(props.open, OPTIONS_ID)
  const place = useTaskOptionsPlacement(props.open, anchorRef, [
    props.effort,
    props.turns,
    props.approvals,
  ])
  useTaskOptionsDismiss(props.open, anchorRef, triggerRef, props.onClose)
  return (
    <span className="hw-options-anchor" ref={anchorRef}>
      <ComposerTaskOptionsTrigger
        ref={triggerRef}
        open={props.open}
        customized={props.customized}
        locked={props.locked}
        optionsId={OPTIONS_ID}
        descriptionId={DESC_ID}
        onClick={(event) => {
          if (!props.open && event.detail === 0) focusFirstRef.current = true
          props.onToggle()
        }}
      />
      <div
        id={OPTIONS_ID}
        className={`hd-menu hw-options-popover${place.below ? ' hw-options-popover--below' : ''}`}
        role="group"
        aria-label="Task options"
        hidden={!props.open}
        style={props.open ? { maxHeight: place.maxHeight } : undefined}
      >
        <ComposerTaskOptionsFields
          locked={props.locked}
          effort={props.effort}
          turns={props.turns}
          approvals={props.approvals}
          effortOptions={props.effortOptions}
          permissionPreview={props.permissionPreview}
          onEffort={props.onEffort}
          onTurns={props.onTurns}
          onApprovals={props.onApprovals}
        />
      </div>
    </span>
  )
}
