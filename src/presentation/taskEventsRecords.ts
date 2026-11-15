import type { TaskEventsRecord } from '../model'
import {
  EVENTS_KIND_LABELS,
  EVENTS_RECORD_SUFFIX,
  EVENTS_STUB_TITLE,
} from './taskEventsCopy'

/** Disclosure title for one record: known kinds by label, others are stubs. */
export function eventRecordTitle(record: TaskEventsRecord): string {
  const label = EVENTS_KIND_LABELS[record.kind]
  return label === undefined ? EVENTS_STUB_TITLE : `${label}${EVENTS_RECORD_SUFFIX}`
}
