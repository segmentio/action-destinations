/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IntegrationError } from '@segment/actions-core'
import { ContextFromDecorator, OperationDecorator, OperationErrorHandlerContext } from '../operationTracking'
import { MessageStats } from './MessageStats'
import { MessageLogger } from './MessageLogger'

export const track = OperationDecorator.createDecoratorFactoryWithDefault(MessageLogger, MessageStats)

export type OperationContext = ContextFromDecorator<typeof track>

type OnErrorHandler = NonNullable<OperationErrorHandlerContext['trackArgs']>['onError']

/**
 * Creates a trackArgs.onError handler that let you wrap the operationContext.error with an IntegrationError unless current error is already an IntegrationError
 * @param args IntegrationError constructor args
 * @returns
 */
export function wrapIntegrationError(
  createIntegrationError: (op: OperationErrorHandlerContext) => IntegrationError
): OnErrorHandler
export function wrapIntegrationError(
  integrationErrorConstructorArgs: ConstructorParameters<typeof IntegrationError>
): OnErrorHandler
export function wrapIntegrationError(args: unknown): OnErrorHandler {
  return (ctx: OperationErrorHandlerContext) => {
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
