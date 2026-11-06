import type { WorkflowEditorField, WorkflowEditorNode } from '../model'
import { WORKFLOW_NODE_UNAVAILABLE } from '../model'
import { Icon } from './Icon'

const HELP_ID = 'workflow-editor-unavailable'

type Props = {
  readonly node: WorkflowEditorNode | null
  readonly missing: boolean
}

export function WorkflowEditorInspector({ node, missing }: Props) {
  return (
    <aside
      className="hd-inspector"
      aria-label={node?.visual === 'orchestrator' ? 'Orchestrator settings' : 'Node settings'}
    >
      {missing || !node ? (
        <p className="caption hd-faint" role="status" style={{ padding: 'var(--space-4)' }}>
          {missing ? WORKFLOW_NODE_UNAVAILABLE : 'Select a node.'}
        </p>
      ) : (
        <InspectorBody node={node} />
      )}
    </aside>
  )
}

function InspectorBody({ node }: { readonly node: WorkflowEditorNode }) {
  return (
    <>
      <div className="hd-inspector__head">
        {node.locked ? <Icon name="lock" size="sm" /> : null}
        <span className="hd-inspector__title">{node.title}</span>
        {node.locked ? null : (
          <button
            type="button"
            className="hd-btn hd-btn--icon hd-btn--sm"
            aria-label="Delete node"
            disabled
            aria-disabled="true"
            aria-describedby={HELP_ID}
          >
            <Icon name="x" size="sm" />
          </button>
        )}
      </div>
      <div className="hd-inspector__body hd-thin-scroll">
        {node.preface ? <p className="caption hd-faint" style={{ margin: 'var(--space-3) 0 0' }}>{node.preface}</p> : null}
        {node.sections.map((section) => (
          <section key={section.id} className="hd-inspector__section">
            <h3 className="hd-inspector__label" style={{ margin: 0 }}>
              {section.label}
            </h3>
            {section.fields.map((field) => (
              <Field key={field.id} field={field} />
            ))}
          </section>
        ))}
        {node.closing ? <p className="caption hd-faint" style={{ margin: 'var(--space-3) 0 0' }}>{node.closing}</p> : null}
      </div>
    </>
  )
}

function Field({ field }: { readonly field: WorkflowEditorField }) {
  if (field.kind === 'note') return <p className="caption hd-faint">{field.text}</p>
  if (field.kind === 'switch') return <SwitchField field={field} />
  if (field.kind === 'stepper') return <StepperField field={field} />
  if (field.kind === 'fallbacks') return <FallbacksField field={field} />
  return <ValueField field={field} />
}

function SwitchField({
  field,
}: {
  readonly field: Extract<WorkflowEditorField, { kind: 'switch' }>
}) {
  return (
    <div className="hd-form-row">
      <span className="hd-form-row__label">
        {field.label}
        {field.hint ? <span className="hd-form-row__hint">{field.hint}</span> : null}
      </span>
      <button
        type="button"
        className="hd-switch"
        role="switch"
        aria-checked={field.checked}
        aria-label={field.label}
        disabled
        aria-disabled="true"
        aria-describedby={HELP_ID}
      />
    </div>
  )
}

function StepperField({
  field,
}: {
  readonly field: Extract<WorkflowEditorField, { kind: 'stepper' }>
}) {
  const name = `${field.label.charAt(0).toLowerCase()}${field.label.slice(1)}`
  return (
    <div className="hd-form-row">
      <span className="hd-form-row__label">{field.label}</span>
      <div className="hd-stepper" role="group" aria-label={name}>
        <button type="button" className="hd-stepper__btn" aria-label={`Decrease ${name}`} disabled aria-disabled="true" aria-describedby={HELP_ID}>
          <Icon name="minus" size="sm" />
        </button>
        <span className="hd-stepper__value">{field.value}</span>
        <button type="button" className="hd-stepper__btn" aria-label={`Increase ${name}`} disabled aria-disabled="true" aria-describedby={HELP_ID}>
          <Icon name="plus" size="sm" />
        </button>
      </div>
    </div>
  )
}

function FallbacksField({
  field,
}: {
  readonly field: Extract<WorkflowEditorField, { kind: 'fallbacks' }>
}) {
  return (
    <div>
      <button
        type="button"
        className="hd-form-row"
        aria-expanded="true"
        aria-controls={field.id}
        disabled
        aria-disabled="true"
        aria-describedby={HELP_ID}
        style={{ width: '100%', border: 0, background: 'transparent', padding: 0, color: 'var(--text)', font: 'inherit' }}
      >
        <span className="hd-form-row__label" style={{ textAlign: 'left' }}>
          {`Fallback harnesses (${field.entries.length})`}
        </span>
        <Icon name="chevron-down" size="sm" />
      </button>
      <div id={field.id} style={{ padding: 'var(--space-1) 0 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {field.entries.map((entry) => (
          <div key={entry} className="hd-row" style={{ fontSize: 13 }}>
            <Icon name="harness" size="sm" />
            <span>{entry}</span>
          </div>
        ))}
        <span className="hd-form-row__hint" style={{ fontSize: 12, lineHeight: '16px', color: 'var(--text-tertiary)' }}>
          {field.hint}
        </span>
      </div>
    </div>
  )
}

function ValueField({
  field,
}: {
  readonly field: Extract<WorkflowEditorField, { kind: 'text' | 'choice' }>
}) {
  const hidden = field.kind === 'text' && field.hideLabel === true
  const long = field.kind === 'text' && (field.label === 'Instructions' || hidden)
  return (
    <div className={hidden || (field.kind === 'text' && !long) ? 'hd-field' : 'hd-form-row'}>
      <label className={`${long || field.kind === 'text' ? 'hd-field__label' : 'hd-form-row__label'}${hidden ? ' hd-sr' : ''}`} htmlFor={field.id}>
        {field.label}
      </label>
      {long ? (
        <textarea id={field.id} className="hd-input" rows={4} value={field.value} disabled aria-disabled="true" aria-describedby={HELP_ID} readOnly />
      ) : field.kind === 'choice' ? (
        <button type="button" id={field.id} className="hd-input hd-select" disabled aria-disabled="true" aria-describedby={HELP_ID}>
          <span>{field.value}</span>
          <Icon name="chevron-down" size="sm" />
        </button>
      ) : (
        <input
          id={field.id}
          className="hd-input"
          type="text"
          value={field.value}
          placeholder={field.value === '' ? 'Default' : undefined}
          disabled
          aria-disabled="true"
          aria-describedby={HELP_ID}
          readOnly
        />
      )}
    </div>
  )
}
