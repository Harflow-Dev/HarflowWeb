import type { ApprovalDecision } from '../model'
import type { AppNavContext } from './appSessionParallel'
import type { NeedsYouApprovalSeed } from './needsYouSession'

export function seedNeedsYouApprovalChrome(
  ctx: AppNavContext,
  seed: NeedsYouApprovalSeed,
): void {
  ctx.children.needsYou.seedApprovalChrome(seed)
  ctx.emit()
}

export function respondNeedsYouTaskApproval(
  ctx: AppNavContext,
  itemId: string,
  decision: ApprovalDecision,
): void {
  ctx.children.needsYou.respondTaskApproval(itemId, decision)
}

export function refreshNeedsYouTaskApproval(
  ctx: AppNavContext,
  itemId: string,
): void {
  ctx.children.needsYou.refreshTaskApproval(itemId)
}

export function answerNeedsYouCheckpoint(
  ctx: AppNavContext,
  itemId: string,
  decision: ApprovalDecision,
): void {
  ctx.children.needsYou.answerCheckpoint(itemId, decision)
}

export function refreshNeedsYouCheckpoint(
  ctx: AppNavContext,
  itemId: string,
): void {
  ctx.children.needsYou.refreshCheckpoint(itemId)
}