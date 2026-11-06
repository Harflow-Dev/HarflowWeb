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
    <aside className="hd-inspector" aria-label="Node settings">
      {missing || !node ? (
        <p className="caption hd-faint" role="status" style={{ padding: 'var(--space-4)' }}>
          {missing ? WORKFLOW_NODE_UNAVAILABLE : 'Select a node.'}
        </p>
      ) : (
        <>
          <div className="hd-inspector__head">
            <span className="hd-inspector__title">{node.title}</span>
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
          </div>
          <div className="hd-inspector__body hd-thin-scroll">
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
          </div>
        </>
      )}
    </aside>
  )
}

function Field({ field }: { readonly field: WorkflowEditorField }) {
  if (field.kind === 'note') {
    return <p className="caption hd-faint">{field.text}</p>
  }
  if (field.kind === 'switch') {
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
  if (field.kind === 'stepper') {
    return (
      <div className="hd-form-row">
        <span className="hd-form-row__label">{field.label}</span>
        <div className="hd-stepper" role="group" aria-label={field.label}>
          <button type="button" className="hd-stepper__btn" aria-label={`Decrease ${field.label}`} disabled aria-disabled="true" aria-describedby={HELP_ID}>
            <Icon name="minus" size="sm" />
          </button>
          <span className="hd-stepper__value">{field.value}</span>
          <button type="button" className="hd-stepper__btn" aria-label={`Increase ${field.label}`} disabled aria-disabled="true" aria-describedby={HELP_ID}>
            <Icon name="plus" size="sm" />
          </button>
        </div>
      </div>
    )
  }
  const long = field.kind === 'text' && field.label === 'Instructions'
  return (
    <div className={field.kind === 'text' && !long ? 'hd-field' : 'hd-form-row'}>
      <label className={long || field.kind === 'text' ? 'hd-field__label' : 'hd-form-row__label'} htmlFor={field.id}>
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
