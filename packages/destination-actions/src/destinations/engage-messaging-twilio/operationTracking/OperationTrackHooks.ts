import { OperationContext } from './OperationContext'

export const DefaultHookPriority = 999 //Number.MAX_SAFE_INTEGER

export interface OperationTrackHooks {
  /**
   * defines hook priority for particular operation state (try/finally/catch)
   * If not defined, DefaultHookPriority is used
   * @param ctx operation context
   */
  getHookPriority?(ctx: OperationContext): number | undefined
  /**
   * Runs before operation try block
   * @param ctx operation context
   */
  beforeOperationTry?(ctx: OperationContext): void
  /**
   * Runs after operation try block
   * @param ctx operation context
   */
  afterOperationTry?(ctx: OperationContext): void
  beforeOperationPrepareError?(ctx: OperationContext): void
  afterOperationPrepareError?(ctx: OperationContext): void
  beforeOperationFinally?(ctx: OperationContext): void
  afterOperationFinally?(ctx: OperationContext): void
}
