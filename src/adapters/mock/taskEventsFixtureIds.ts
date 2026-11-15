import { asTaskId } from '../../model'

// Single-specimen mock choice: the design draws one id, 7be02d91, so every
// Events fixture shares that 8-character prefix. As a real lookup prefix it
// would be ambiguous. Distinct full ids keep the fixtures apart.
export const TASK_EVENTS_POPULATED_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f01',
)
export const TASK_EVENTS_PAGE_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f02',
)
export const TASK_EVENTS_PAGE_ERROR_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f03',
)
export const TASK_EVENTS_NOT_STARTED_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f04',
)
export const TASK_EVENTS_LOADING_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f05',
)
export const TASK_EVENTS_EMPTY_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f06',
)
export const TASK_EVENTS_ERROR_ID = asTaskId(
  '7be02d91-5a3c-4e8f-b1d6-0c42a9e73f07',
)
