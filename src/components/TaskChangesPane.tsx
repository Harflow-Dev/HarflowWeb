import type {
  ChangedFileRow,
  DiffContent,
  DiffLine,
  TaskChangesLoad,
} from '../model'
import { Icon } from './Icon'

type Props = {
  readonly load: TaskChangesLoad
  /** Retained rows so selection can keep the list mounted while a diff loads. */
  readonly files: readonly ChangedFileRow[] | null
  readonly selectedPath: string | null
  readonly onSelectFile: (path: string) => void
  readonly onUnavailable: (label: string) => void
}

/**
 * Read-only Changes side pane. Recorded repository observations only —
 * not Git, downloads, edits, or authorship proof.
 * File list stays mounted across diff loads when `files` is retained.
 */
export function TaskChangesPane({
  load,
  files,
  selectedPath,
  onSelectFile,
  onUnavailable,
}: Props) {
  const fileCount = files?.length ?? null

  return (
    <aside className="hd-pane" aria-label="Task details">
      <div className="hd-pane__head">
        <div className="hd-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className="hd-tab is-active"
          >
            Changes
            {fileCount !== null ? (
              <span className="hd-tab__count">{fileCount}</span>
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="false"
            className="hd-tab"
            onClick={() => onUnavailable('Artifacts')}
          >
            Artifacts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="false"
            className="hd-tab"
            onClick={() => onUnavailable('Events')}
          >
            Events
          </button>
        </div>
      </div>
      <PaneBody
        load={load}
        files={files}
        selectedPath={selectedPath}
        onSelectFile={onSelectFile}
      />
    </aside>
  )
}

function PaneBody({
  load,
  files,
  selectedPath,
  onSelectFile,
}: {
  readonly load: TaskChangesLoad
  readonly files: readonly ChangedFileRow[] | null
  readonly selectedPath: string | null
  readonly onSelectFile: (path: string) => void
}) {
  if (files === null) {
    if (load.kind === 'unavailable') {
      return (
        <div className="hd-scroll" style={{ padding: 'var(--space-3)' }}>
          <p className="caption hd-faint" role="status">
            {load.message}
          </p>
        </div>
      )
    }
    return (
      <div className="hd-scroll" style={{ padding: 'var(--space-3)' }}>
        <p className="caption hd-faint" role="status">
          Loading changes… (proposal — not a design-approved specimen)
        </p>
      </div>
    )
  }

  return (
    <div
      className="hd-scroll"
      style={{
        padding: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <ul
        aria-label="Changed files"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {files.map((file) => {
          const selected = file.path === selectedPath
          return (
            <li key={file.path}>
              <button
                type="button"
                className={`hd-file${selected ? ' is-active' : ''}`}
                aria-label={file.path}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelectFile(file.path)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: selected ? 'var(--surface-active)' : undefined,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon name="file" size="sm" />
                <span className="hd-file__path">{file.path}</span>
                <span className="hd-file__add">+{file.additions}</span>
                <span className="hd-file__del">{`\u2212${file.deletions}`}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {selectedPath ? (
        <div
          className="caption hd-faint"
          style={{ padding: '0 var(--space-3)' }}
        >
          {selectedPath}
        </div>
      ) : null}
      <DiffRegion load={load} selectedPath={selectedPath} />
    </div>
  )
}

function DiffRegion({
  load,
  selectedPath,
}: {
  readonly load: TaskChangesLoad
  readonly selectedPath: string | null
}) {
  if (load.kind === 'loading') {
    return (
      <p className="caption hd-faint" role="status">
        Loading changes… (proposal — not a design-approved specimen)
      </p>
    )
  }
  if (load.kind === 'unavailable') {
    return (
      <p className="caption hd-faint" role="status">
        {load.message}
      </p>
    )
  }
  if (!selectedPath) {
    return null
  }
  return <DiffBody path={selectedPath} diff={load.observation.diff} />
}

function DiffBody({
  path,
  diff,
}: {
  readonly path: string
  readonly diff: DiffContent
}) {
  if (diff.kind === 'empty') {
    return (
      <p className="caption hd-faint" role="status">
        No recorded diff lines for this file.
      </p>
    )
  }
  if (diff.kind === 'unavailable') {
    return (
      <p className="caption hd-faint" role="status">
        {diff.message}
      </p>
    )
  }
  const shortName = path.includes('/')
    ? path.slice(path.lastIndexOf('/') + 1)
    : path
  return (
    <div className="hd-diff" role="group" aria-label={`Diff of ${shortName}`}>
      {diff.lines.map((line, index) => (
        <DiffLineRow key={`${line.kind}-${index}`} line={line} />
      ))}
    </div>
  )
}

function DiffLineRow({ line }: { readonly line: DiffLine }) {
  const modifier =
    line.kind === 'add'
      ? ' hd-diff__line--add'
      : line.kind === 'del'
        ? ' hd-diff__line--del'
        : line.kind === 'hunk'
          ? ' hd-diff__line--hunk'
          : ''
  const sign =
    line.kind === 'add' ? '+' : line.kind === 'del' ? '\u2212' : ''
  return (
    <div className={`hd-diff__line${modifier}`}>
      <span className="hd-diff__sign">{sign}</span>
      {line.text}
    </div>
  )
}
