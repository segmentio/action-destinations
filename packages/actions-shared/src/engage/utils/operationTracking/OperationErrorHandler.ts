import { TrackedError } from './TrackedError'
import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'

export type OperationErrorHandlerContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    decoratorArgs?: {
      onError?: (ctx: OperationErrorHandlerContext<TContext>) => void
    }
  }

/**
 * Allows operation decorator to have onError handler for wrapping rethrown errors
 */
export class OperationErrorHandler {
  static getTryCatchFinallyHook(_ctx: OperationErrorHandlerContext): TryCatchFinallyHook<OperationErrorHandlerContext> {
    return this
  }

  static onCatch(ctx: OperationErrorHandlerContext) {
    const dArgs = ctx.decoratorArgs

    // attaches underlyingError to the wrapper, trackedContext etc
    ctx.error = this.wrap(
      ctx.error,
      () => {
        // onError callback can wrap the error, modify it, remove it, change props, add logs/stats of the ctx operation, etc.
        dArgs?.onError?.apply(this, [ctx])
        return ctx.error as TrackedError
      },
      ctx
    )
  }

  static wrap<TContext extends OperationErrorHandlerContext = OperationErrorHandlerContext>(
    originalError: unknown,
    getWrapper: (e: unknown) => unknown | undefined,
    ctx?: TContext
  ) {
    const wrapper = getWrapper(originalError) as TrackedError
    // if error was wrapped, we want wrapper.underlyingError = originalError
    if (wrapper && originalError !== wrapper) wrapper.underlyingError = originalError

    const trackedError = wrapper
    if (!trackedError) return //in case onError handler removed the error

    if (!ctx) return

    // if trackedContext is not assigned yet, assign it now
    if (!trackedError.trackedContext) trackedError.trackedContext = ctx

    // need to make sure trackedError.trackedContext is not enumerable, because this will cause JSON.stringify to fail with circular reference
    const trackedContextProp = Object.getOwnPropertyDescriptor(trackedError, 'trackedContext')
    if (trackedContextProp?.enumerable) {
      //to make sure the operation context is not JSON.stringified with error
      trackedContextProp.enumerable = false
      Object.defineProperty(trackedError, 'trackedContext', trackedContextProp)
    }

    return wrapper
  }
}
