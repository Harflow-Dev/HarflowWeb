/**
 * In-flight state for Needs you workflow checkpoint answers. Owned by the
 * session (not the resettable screen chrome) so a restart of the screen
 * cannot lose a pending answer.
 */
export function checkpointFlightKey(runId: string, token: string): string {
  return `${runId}\u0000${token}`
}

export class CheckpointAnswerRegistry {
  private readonly inFlight = new Set<string>()
  private events = 0

  isInFlight(runId: string, token: string): boolean {
    return this.inFlight.has(checkpointFlightKey(runId, token))
  }

  /** Returns false when this checkpoint already has an answer in flight. */
  beginAnswer(runId: string, token: string): boolean {
    const key = checkpointFlightKey(runId, token)
    if (this.inFlight.has(key)) return false
    this.inFlight.add(key)
    this.events += 1
    return true
  }

  endAnswer(runId: string, token: string): void {
    this.inFlight.delete(checkpointFlightKey(runId, token))
    this.events += 1
  }

  /** Bumped when an answer starts or settles; a refresh across it is stale. */
  generation(): number {
    return this.events
  }
}
