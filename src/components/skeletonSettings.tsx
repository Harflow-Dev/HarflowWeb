import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { SKEL_TITLE_WIDTHS } from './skeletonConstants'
import { SkelBlock, SkelLine, SkelStatus } from './skeletonPrimitives'

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
      aria-label="Loading Harnesses"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      data-skel-region=""
    >
      <SkelStatus>Loading harness registration…</SkelStatus>
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

function ApprovalRowSkeleton({ index }: { readonly index: number }) {
  return (
    <div
      className="hd-form-row"
      aria-hidden="true"
      style={{ minHeight: 36, paddingLeft: 'var(--space-3)' }}
    >
      <SkelLine
        width={SKEL_TITLE_WIDTHS[(index + 1) % SKEL_TITLE_WIDTHS.length]!}
        height={14}
      />
      <span style={{ flex: 1 }} />
      <SkelBlock width={64} height={26} shape="pill" />
    </div>
  )
}

/** Placeholder for the expanded harness's approvals, shaped like the loaded panel. */
function McpApprovalsPanelSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="mcp-approvals-skeleton"
      style={{
        marginLeft: 44,
        padding: 'var(--space-2) 0 var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <SkelLine width={320} height={10} />
      {[0, 1, 2].map((index) => (
        <ApprovalRowSkeleton key={index} index={index} />
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          paddingLeft: 'var(--space-3)',
        }}
      >
        <SkelBlock width="100%" height={32} shape="soft" style={{ flex: 1 }} />
        <SkelBlock width={110} height={32} shape="pill" />
      </div>
    </div>
  )
}

/**
 * Assumption: the expanded harness is the first row. Placeholder rows are
 * anonymous before data arrives, so the approvals placeholder always sits
 * under row 0 regardless of the expanded id (Claude Code, the preview seed,
 * is first in the fixture).
 *
 * Settings MCP approvals first-load. One harness is expanded (session state),
 * so only the first row carries an approvals placeholder; on ready the same
 * harness stays expanded and its approvals replace the placeholders. This
 * differs from the Design `settings/loading-mcp-approvals` drawing, which
 * shows a placeholder under every row.
 */
export function SettingsMcpApprovalsLoading(): ReactNode {
  return (
    <div
      role="group"
      aria-busy="true"
      aria-label="Loading MCP approvals"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      data-skel-region=""
    >
      <SkelStatus>Loading MCP approvals…</SkelStatus>
      <SettingsHarnessChrome />
      <div>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index}>
            <HarnessRowSkeleton index={index} />
            {index === 0 ? <McpApprovalsPanelSkeleton /> : null}
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
