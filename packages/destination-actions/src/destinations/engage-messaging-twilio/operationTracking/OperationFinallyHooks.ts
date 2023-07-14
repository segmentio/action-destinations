import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'

export type OperationFinallyHooksContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    onFinally: (() => void)[]
  }

/**
 * Hook that provide currentOperation.onFinally hooks array for the user to add custom logic that will be executed onFinally - e.g. add parameter of the function to the log in case of operation failure
 */
export class OperationFinallyHooks {
  static getTryCatchFinallyHook(_ctx: OperationFinallyHooksContext): TryCatchFinallyHook<OperationFinallyHooksContext> {
    return this as any
  }
  static getPriority() {
    return 100 //invoked after all standard hooks
  }

  static onTry<TContext extends TryCatchFinallyContext>(ctx: OperationFinallyHooksContext<TContext>) {
    ctx.onFinally = []
  }

  static onFinally<TContext extends TryCatchFinallyContext>(ctx: OperationFinallyHooksContext<TContext>) {
    for (const hook of ctx.onFinally) {
      try {
        hook()
      } catch (err) {
        //todo - log finally hook error
      }
    }
  }
}
