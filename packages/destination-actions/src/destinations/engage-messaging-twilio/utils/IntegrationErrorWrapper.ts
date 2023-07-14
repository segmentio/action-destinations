import { IntegrationError } from '@segment/actions-core'
import { TryCatchFinallyContext, TryCatchFinallyHook } from '../operationTracking'

export type IntegrationErrorWrapperContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> =
  TContext & {
    trackArgs?: {
      wrapIntegrationError?: ((ctx: TContext) => IntegrationError) | ConstructorParameters<typeof IntegrationError>
    }
  }

/**
 * Lets to simply wrap errors into IntegrationError right from the track decorator
 */
export class IntegrationErrorWrapper {
  static getTryCatchFinallyHook(
    _ctx: IntegrationErrorWrapperContext
  ): TryCatchFinallyHook<IntegrationErrorWrapperContext> {
    return this
  }
  static onCatch(ctx: IntegrationErrorWrapperContext) {
    const args = ctx.trackArgs?.wrapIntegrationError
    if (ctx.trackArgs?.wrapIntegrationError) {
      const error = ctx.error
      if (!(error instanceof IntegrationError)) {
        if (args instanceof Function) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          ctx.error = args(ctx)
        } else if (args instanceof Array) {
          ctx.error = new IntegrationError(...(args as ConstructorParameters<typeof IntegrationError>))
        }
      }
    }
  }
}
