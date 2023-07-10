import { OperationContext } from './OperationContext'

export interface OperationTrackHooks {
  getHookPriority?(ctx: OperationContext): number | undefined
  beforeOperationTry?(ctx: OperationContext): void
  afterOperationTry?(ctx: OperationContext): void
  beforeOperationPrepareError?(ctx: OperationContext): void
  afterOperationPrepareError?(ctx: OperationContext): void
  beforeOperationFinally?(ctx: OperationContext): void
  afterOperationFinally?(ctx: OperationContext): void
}
