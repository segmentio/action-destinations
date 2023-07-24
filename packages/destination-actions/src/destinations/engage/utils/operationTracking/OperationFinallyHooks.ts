import { OperationLoggerContext } from './OperationLogger'
import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'

export type OperationFinallyHooksContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    onFinally: (() => void)[]
    decoratorArgs?: {
      onTry?: (ctx: TContext) => void
      onFinally?: (ctx: TContext) => void
    }
  }

/**
 * Hook that provide currentOperation.onFinally hooks array for the user to add custom logic that will be executed onFinally - e.g. add parameter of the function to the log in case of operation failure
 */
export class OperationFinallyHooks {
  static getTryCatchFinallyHook(_ctx: OperationFinallyHooksContext): TryCatchFinallyHook<OperationFinallyHooksContext> {
    return this
  }
  static getPriority() {
    return 100 //invoked after all standard hooks
  }

  static onTry<TContext extends TryCatchFinallyContext>(ctx: OperationFinallyHooksContext<TContext>) {
    ctx.onFinally = []
    ctx.decoratorArgs?.onTry?.(ctx)
  }

  static onFinally<TContext extends TryCatchFinallyContext>(ctx: OperationFinallyHooksContext<TContext>) {
    for (const hook of ctx.onFinally) {
      try {
        hook()
      } catch (e) {
        const error = e as Error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loggerCtx = ctx as Partial<OperationLoggerContext>
        if (loggerCtx.logs) loggerCtx.logs.push(`Error in onFinally hook: ${error?.message || error.toString()}`)
      }
    }
    ctx.decoratorArgs?.onFinally?.(ctx)
  }
}
