/** Pure prompt helpers — no DOM or framework. */

export function isSubmittablePrompt(prompt: string): boolean {
  return prompt.trim().length > 0
}
