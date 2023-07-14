import { TrackedError } from './TrackedError'
import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'

export type OperationErrorHandlerContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    trackArgs?: {
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
    const origError = ctx.error
    const trArgs = ctx.trackArgs
    let trackedError = origError as TrackedError

    // onError callback can wrap the error, modify it, add new tags, logs etc
    trArgs?.onError?.apply(this, [ctx])

    // if error was wrapped, we want wrappedError.underlyingError = originalError
    if (ctx.error !== origError) {
      trackedError = ctx.error as TrackedError
      trackedError.underlyingError = origError
    }
    if (!trackedError.trackedContext) trackedError.trackedContext = ctx

    // need to make sure trackedError.trackedContext is not enumerable, because this will cause JSON.stringify to fail with circular reference
    const ctxProp = Object.getOwnPropertyDescriptor(trackedError, 'trackedContext')
    if (ctxProp?.enumerable) {
      //to make sure the operation context is not JSON.stringified with error
      ctxProp.enumerable = false
      Object.defineProperty(trackedError, 'trackedContext', ctxProp)
    }
  }
}
