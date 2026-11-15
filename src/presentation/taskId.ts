/** Eight-character task id prefix, as the engine accepts for lookups. */
export function shortTaskId(taskId: string): string {
  return taskId.slice(0, 8)
}
