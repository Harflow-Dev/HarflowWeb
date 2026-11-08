import type { TranscriptRow } from '../model'

/** Specimen synthetic rows for local reading actions (Design 854caae). */
export function earlierRow(
  sourceEpoch: string,
  windowEpoch: number,
): TranscriptRow {
  return {
    id: 'row-earlier',
    sourceEpoch,
    windowEpoch,
    occurrence: -1,
    seq: 5,
    type: 'message',
    anchorId: 'earlier',
    title: 'Earlier captured activity',
    body: 'Read slot release implementation.',
  }
}

export function freshRow(
  sourceEpoch: string,
  windowEpoch: number,
): TranscriptRow {
  return {
    id: 'row-new',
    sourceEpoch,
    windowEpoch,
    occurrence: 3,
    seq: 10,
    type: 'message',
    anchorId: 'new',
    title: 'New captured activity',
    body: 'Focused validation result received.',
  }
}

export function currentWindowRow(
  sourceEpoch: string,
  windowEpoch: number,
): TranscriptRow {
  return {
    id: 'row-current',
    sourceEpoch,
    windowEpoch,
    occurrence: 0,
    seq: 1,
    type: 'message',
    anchorId: 'new',
    title: 'Current activity window',
    body: 'This view now shows current captured activity. Earlier rows are outside this view.',
  }
}

export const SPECIMEN_ROW_FACTORY = {
  earlier: earlierRow,
  fresh: freshRow,
  current: currentWindowRow,
} as const
