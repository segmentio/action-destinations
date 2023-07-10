import { OperationContext } from './OperationContext'
import { OperationTrackHooks } from './OperationTrackHooks'

declare module './OperationContext' {
  interface OperationContext {
    start?: number
    duration?: number
  }
}

export class OperationDuration implements OperationTrackHooks {
  getHookPriority() {
    return 0 // should be first
  }
  afterOperationTry(ctx: OperationContext) {
    ctx.start = Date.now()
  }

  beforeOperationFinally(ctx: OperationContext) {
    if (ctx.start !== undefined) ctx.duration = Date.now() - ctx.start
  }
}
