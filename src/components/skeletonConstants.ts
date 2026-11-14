export type SkelShape = 'line' | 'pill' | 'circle' | 'soft' | 'rect'

/** Alternating title widths from Design skeleton-specs `TITLE`. */
export const SKEL_TITLE_WIDTHS = [190, 140, 168, 120] as const

/**
 * Task transcript placeholder box height: the running-stop transcript at the
 * 1280 x 800 reference frame (Design pins the loading region to it).
 */
export const TASK_TRANSCRIPT_SKELETON_HEIGHT = 447
