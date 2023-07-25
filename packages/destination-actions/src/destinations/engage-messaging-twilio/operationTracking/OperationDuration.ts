import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'

export type OperationDurationContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> = TContext & {
  start?: number
  duration?: number
}

export class OperationDuration {
  static getTryCatchFinallyHook(_ctx: OperationDurationContext): TryCatchFinallyHook<OperationDurationContext> {
    return this
  }
  static getPriority() {
    return -1000 // should be first
  }
  static onTry(ctx: OperationDurationContext) {
    ctx.start = Date.now()
  }

  static onFinally(ctx: OperationDurationContext) {
    if (ctx.start !== undefined) ctx.duration = Date.now() - ctx.start
  }
  static getDuration<TContext extends OperationDurationContext>(ctx: TContext) {
    return ctx.duration
  }
}
