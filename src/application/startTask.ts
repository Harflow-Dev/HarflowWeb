import { isSubmittablePrompt } from '../model'
import type { StartTaskOutcome, StartTaskRequest } from '../model'
import type { EnginePort } from './enginePort'

export type StartTaskUseCase = {
  execute(request: StartTaskRequest): Promise<StartTaskOutcome>
}

export function createStartTaskUseCase(engine: EnginePort): StartTaskUseCase {
  return {
    async execute(request) {
      if (!isSubmittablePrompt(request.prompt)) {
        return {
          kind: 'refused',
          code: 'invalid_params',
          reason: 'Prompt is empty.',
        }
      }
      try {
        return await engine.startTask(request)
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : 'engine startTask rejected'
        return {
          kind: 'unknown',
          message: `fixture: owner did not report; ${detail}`,
        }
      }
    },
  }
}
