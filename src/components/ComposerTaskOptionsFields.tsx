import type { ApprovalsMode, EffortLevel } from '../presentation/taskOptions'
import { ComposerTaskOptionsCaptions } from './ComposerTaskOptionsCaptions'

type Props = {
  readonly locked: boolean
  readonly effort: EffortLevel
  readonly turns: string
  readonly approvals: ApprovalsMode
  readonly effortOptions: readonly EffortLevel[]
  readonly permissionPreview: string
  readonly onEffort: (value: EffortLevel) => void
  readonly onTurns: (value: string) => void
  readonly onApprovals: (value: ApprovalsMode) => void
}

/** Fields and captions inside the Task options popover. */
export function ComposerTaskOptionsFields(props: Props) {
  return (
    <>
      <strong>Task options</strong>
      <div className="hw-options-fields">
        <label>
          Effort
          <select
            value={props.effort}
            disabled={props.locked}
            onChange={(e) => props.onEffort(e.target.value as EffortLevel)}
          >
            {props.effortOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Turn limit
          <input
            className="hd-input"
            type="text"
            inputMode="numeric"
            value={props.turns}
            disabled={props.locked}
            onChange={(e) => props.onTurns(e.target.value)}
          />
        </label>
        <label>
          Approvals
          <select
            value={props.approvals}
            disabled={props.locked}
            onChange={(e) => props.onApprovals(e.target.value as ApprovalsMode)}
          >
            <option value="harness">Harness managed</option>
            <option value="caller">Caller approvals (supported harness only)</option>
          </select>
        </label>
      </div>
      <ComposerTaskOptionsCaptions permissionPreview={props.permissionPreview} />
    </>
  )
}
