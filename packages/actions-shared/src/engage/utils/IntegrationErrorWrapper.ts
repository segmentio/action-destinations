import { IntegrationError } from '@segment/actions-core'
import { OperationErrorHandler, TryCatchFinallyContext, TryCatchFinallyHook } from './operationTracking'
import { ResponseError } from './ResponseError'

export type IntegrationErrorWrapperContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    decoratorArgs?: {
      wrapIntegrationError?: (ctx: TContext) => IntegrationError | ConstructorParameters<typeof IntegrationError>
    }
  }

/**
 * Lets to wrap errors into IntegrationError right from the track decorator.
 * After wrapping it tries to replace status with the one from the original error's response object if it exists.
 */
export class IntegrationErrorWrapper {
  static getTryCatchFinallyHook(
    _ctx: IntegrationErrorWrapperContext
  ): TryCatchFinallyHook<IntegrationErrorWrapperContext> {
    return this
  }
  static onCatch(ctx: IntegrationErrorWrapperContext) {
    const getWrapper = ctx.decoratorArgs?.wrapIntegrationError
    if (!getWrapper) return
    ctx.error = this.wrap(ctx.error, () => getWrapper(ctx), ctx)
  }

  static wrap<TContext extends TryCatchFinallyContext>(
    error: unknown,
    getWrapper: () => IntegrationError | ConstructorParameters<typeof IntegrationError>,
    ctx?: TContext
  ) {
    return OperationErrorHandler.wrap(
      error,
      () => {
        if (error instanceof IntegrationError) return error
        const wrapper = getWrapper()
        const resultError = (Array.isArray(wrapper) ? new IntegrationError(...wrapper) : wrapper) as ResponseError

        //trying to get original error status from Response if esist. If there is one, we set it to the result error
        const responseErrorStatus = resultError.response?.data?.status
        if (responseErrorStatus) {
          resultError.status = responseErrorStatus
        }
        return resultError
      },
      ctx
    )
  }
}
