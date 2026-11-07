type Props = {
  readonly permissionPreview: string
}

/** Permission and qualification captions in the Task options popover. */
export function ComposerTaskOptionsCaptions({ permissionPreview }: Props) {
  return (
    <>
      <p className="caption">
        Permission preview: {permissionPreview} · enforcement supported. The
        selected harness reports support for the requested access; this is not an
        OS sandbox guarantee.
      </p>
      <p className="caption">
        Harness qualification: ready. Unsupported requested choices stay visible
        for review.
      </p>
    </>
  )
}
