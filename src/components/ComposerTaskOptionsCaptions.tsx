import type { ComposerQualification } from '../model'

type Props = {
  readonly permissionPreview: string
  readonly qualification: ComposerQualification
}

/** Permission and qualification captions in the Task options popover. */
export function ComposerTaskOptionsCaptions({
  permissionPreview,
  qualification,
}: Props) {
  return (
    <>
      <p className="caption">
        Permission preview: {permissionPreview} · enforcement supported. The
        selected harness reports support for the requested access; this is not an
        OS sandbox guarantee.
      </p>
      <p className="caption">
        Harness qualification: {qualification}. Unsupported requested choices
        stay visible for review.
      </p>
    </>
  )
}
