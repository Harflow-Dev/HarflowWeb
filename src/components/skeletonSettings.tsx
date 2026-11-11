import type { ReactNode } from 'react'
import type { Appearance } from '../model'
import { Icon } from './Icon'
import { SkelBlock, SkelLine, SKEL_TITLE_WIDTHS } from './skeletonPrimitives'
import { ThemeToggle } from './ThemeToggle'

function BehaviourLoadingSection() {
  return (
    <section aria-label="Behaviour" style={{ marginTop: 'var(--space-6)' }}>
      <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
        Behaviour
      </h2>
      {[
        'Open the window when a task starts',
        'Notify when a task finishes',
        'Notify when a request needs you',
      ].map((label) => (
        <div key={label} className="hd-form-row" style={{ minHeight: 40 }}>
          <div className="hd-form-row__label">{label}</div>
          <SkelBlock width={40} height={24} shape="pill" />
        </div>
      ))}
    </section>
  )
}

function RuntimeStoreLoadingSections() {
  return (
    <>
      <section aria-label="Harflow runtime" style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
          Harflow runtime
        </h2>
        <div className="hd-form-row" style={{ minHeight: 40 }}>
          <div className="hd-form-row__label">
            <SkelLine width={200} height={12} />
          </div>
          <button
            type="button"
            className="hd-btn hd-btn--secondary"
            disabled
            aria-disabled="true"
          >
            Check for updates
          </button>
        </div>
      </section>
      <section aria-label="Task store" style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
          Task store
        </h2>
        <div className="hd-form-row" style={{ minHeight: 40 }}>
          <div className="hd-form-row__label">
            <SkelLine width={170} height={12} />
          </div>
          <span style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="hd-btn hd-btn--secondary"
              disabled
              aria-disabled="true"
            >
              Inspect task store
            </button>
            <button
              type="button"
              className="hd-btn hd-btn--ghost"
              disabled
              aria-disabled="true"
            >
              Show backup in Finder
            </button>
          </span>
        </div>
      </section>
    </>
  )
}

/** Settings General first-load — Design `settings/loading-general`. */
export function SettingsGeneralLoading({
  appearance,
  onAppearance,
}: {
  readonly appearance: Appearance
  readonly onAppearance: (appearance: Appearance) => void
}): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Settings"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
    >
      <section aria-label="Appearance">
        <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
          Appearance
        </h2>
        <div className="hd-form-row" style={{ minHeight: 40 }}>
          <div className="hd-form-row__label">
            Theme
            <span className="hd-form-row__hint">Also in the sidebar footer.</span>
          </div>
          <ThemeToggle appearance={appearance} onChange={onAppearance} labeled />
        </div>
      </section>
      <BehaviourLoadingSection />
      <RuntimeStoreLoadingSections />
    </div>
  )
}

function HarnessRowSkeleton({ index }: { readonly index: number }) {
  return (
    <div
      className="hd-form-row"
      aria-hidden="true"
      style={{ height: 44, boxSizing: 'border-box' }}
    >
      <SkelBlock width={32} height={32} shape="soft" />
      <span style={{ flex: 1, display: 'block' }}>
        <SkelLine
          width={SKEL_TITLE_WIDTHS[index % SKEL_TITLE_WIDTHS.length]! / 2}
          height={14}
        />
      </span>
      <SkelBlock width={82} height={22} shape="pill" />
      <SkelBlock width={75} height={32} shape="pill" />
    </div>
  )
}

function QualificationRowSkeleton({ index }: { readonly index: number }) {
  return (
    <div
      className="hd-form-row"
      aria-hidden="true"
      style={{ minHeight: 28 }}
      data-skel-region=""
    >
      <SkelBlock width={130} height={14} shape="line" />
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SkelBlock width={16} height={16} shape="circle" />
        <SkelLine width={index === 1 ? 300 : 60} height={12} />
      </span>
    </div>
  )
}

function SettingsHarnessChrome() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="body" style={{ margin: 0 }}>
          Where Harflow is registered as an MCP server
        </div>
        <div className="caption hd-faint">
          <SkelLine width={220} height={10} />
        </div>
      </div>
      <button
        type="button"
        className="hd-btn hd-btn--icon hd-btn--sm"
        aria-label="Refresh"
        disabled
        aria-disabled="true"
      >
        <Icon name="refresh" />
      </button>
    </div>
  )
}

/** Settings Harnesses first-load — Design `settings/loading-harnesses`. */
export function SettingsHarnessesLoading(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Settings"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      data-skel-region=""
    >
      <SettingsHarnessChrome />
      <div>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index}>
            <HarnessRowSkeleton index={index} />
            <hr
              style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }}
            />
          </div>
        ))}
      </div>
      <section aria-label="Harness qualification">
        <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
          Harness qualification
        </h2>
        {Array.from({ length: 5 }, (_, index) => (
          <QualificationRowSkeleton key={index} index={index} />
        ))}
      </section>
    </div>
  )
}

/** Settings MCP approvals first-load — Design `settings/loading-mcp-approvals`. */
export function SettingsMcpApprovalsLoading(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading Settings"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      data-skel-region=""
    >
      <SettingsHarnessChrome />
      <div>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index}>
            <HarnessRowSkeleton index={index} />
            <div
              className="hd-form-row"
              aria-hidden="true"
              style={{
                height: 44,
                boxSizing: 'border-box',
                paddingLeft: 44,
              }}
            >
              <SkelLine
                width={SKEL_TITLE_WIDTHS[(index + 1) % SKEL_TITLE_WIDTHS.length]!}
                height={14}
              />
              <span style={{ flex: 1 }} />
              <SkelBlock width={64} height={26} shape="pill" />
            </div>
            <hr
              style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }}
            />
          </div>
        ))}
      </div>
      <section aria-label="Harness qualification">
        <h2 className="label hd-faint" style={{ margin: 0, fontWeight: 500 }}>
          Harness qualification
        </h2>
        {Array.from({ length: 5 }, (_, index) => (
          <QualificationRowSkeleton key={index} index={index} />
        ))}
      </section>
    </div>
  )
}
