/** Scenario ids for approved task/approval-* states (Design 56b49cb). */
export type TaskApprovalsScenarioId =
  | 'approval-exact'
  | 'approval-stale'
  | 'approval-expired'
  | 'approval-answered-elsewhere'
  | 'approval-refused'
  | 'approval-uncertain'
