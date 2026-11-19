/** Scenario ids for approved task/message-* queued states (Design 7de89a4). */
export type TaskMessagesScenarioId =
  | 'message-queued'
  | 'message-delivering'
  | 'message-delivered'
  | 'message-cancelled'
  | 'message-send-now-refused'
  | 'message-uncertain'
  | 'message-unsupported'
  | 'message-queued-settled'
