/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericMethodDecorator } from './GenericMethodDecorator'
import { OperationDuration } from './OperationDuration'
import { OperationErrorHandler } from './OperationErrorHandler'
import { OperationFinallyHooks } from './OperationFinallyHooks'
import { OperationTree } from './OperationTree'
import {
  FuncFromTryCatchFinallyContext,
  TryCatchFinallyContext,
  TryCatchFinallyHook,
  wrapTryCatchFinallyPromisable
} from './wrapTryCatchFinallyPromisable'

/**
 * Base Configuration used by track decorator defining how the method execution should be tracked
 */
export interface TrackArgs {
  /**
   * Name of the operation to be tracked. By default the method name is used.
   * The name is used in log messages and stats metric - so it should be only using alphanumeric, underscores and dots
   */
  operation?: string
  /**
   * Callback for preparing Error object to be logged/rethrown. You can reassign the error to be thrown or add tags/logs to context which will be used in the finally
   * @param ctx operation context, which contains the error (ctx.error)
   */

  [key: string]: any
}

export type OperationHookContext<
  TContext extends TryCatchFinallyContext = TryCatchFinallyContext,
  TTrackArgs extends TrackArgs = TrackArgs
> = TContext & {
  trackArgs?: TTrackArgs
}

/**
 * Knows how to get the tryCatchFinally hook for the operation, which is invoked by the wrapTryCatchFinally for each wrapped function call
 * Each hook provider impacts the evetuak types of TrackArgs and operation Context of the decorator
 * Each hook provider is invoked for each decorated function call, so be mindful about memory usage and use singletons where you don't need state
 */
export interface OperationHookProvider<
  TContext extends OperationHookContext = OperationHookContext,
  TDecoratorUtils = {}
> {
  /**
   * Gets or creates tryCatchFinally hook for the operation
   * @param ctx tryCatchFinally context
   */
  getTryCatchFinallyHook(ctx: TContext): TryCatchFinallyHook<TContext>

  getDecoratorUtils?(): TDecoratorUtils
}

export type UnionTypesFromArray<T, TDefault = {}> = T extends [head: infer THead, ...args: infer TTail]
  ? THead & UnionTypesFromArray<TTail>
  : TDefault
export type TrackArgsFromContext<TContext extends TryCatchFinallyContext> = TContext extends {
  trackArgs?: infer TTrackArgs
}
  ? TTrackArgs
  : TrackArgs

export type ContextFromHookProviders<TProviders extends OperationHookProvider[]> = TProviders extends [
  OperationHookProvider<infer THeadContext>,
  ...infer TRestProviders
]
  ? THeadContext &
      (TRestProviders extends OperationHookProvider[]
        ? ContextFromHookProviders<TRestProviders>
        : TryCatchFinallyContext)
  : TryCatchFinallyContext

export type DecoratorUtilsFromHookProviders<TProviders extends OperationHookProvider[]> = TProviders extends [
  OperationHookProvider<any, infer TDecoratorUtils>,
  ...infer TRestProviders
]
  ? TDecoratorUtils &
      (TRestProviders extends OperationHookProvider[] ? DecoratorUtilsFromHookProviders<TRestProviders> : {})
  : {}

export type TrackArgsFromHookProviders<TProviders extends OperationHookProvider[]> = TrackArgsFromContext<
  ContextFromHookProviders<TProviders>
>

export type FuncFromHookProviders<TProviders extends OperationHookProvider[]> = FuncFromTryCatchFinallyContext<
  ContextFromHookProviders<TProviders>
>

export class OperationDecorator {
  /**
   * creates a decorator factory for the given set of hook providers.
   * Each hook provider impacts the evetuak types of TrackArgs and operation Context of the decorator
   * Each hook provider is invoked for each decorated function call, so be mindful about memory usage and use singletons where you don't need state
   * @param hookProviders set of hook providers.
   */
  static createDecoratorFactory<TOperationHookProviders extends OperationHookProvider[]>(
    ...hookProviders: TOperationHookProviders
  ): ((
    trackArgs?: TrackArgsFromHookProviders<TOperationHookProviders>
  ) => GenericMethodDecorator<FuncFromHookProviders<TOperationHookProviders>>) &
    DecoratorUtilsFromHookProviders<TOperationHookProviders> & {
      _contextType: ContextFromHookProviders<TOperationHookProviders>
    } {
    type TFunc = FuncFromHookProviders<TOperationHookProviders>
    type TTrackArgs = TrackArgsFromHookProviders<TOperationHookProviders>

    const decorator = (trackArgs?: TTrackArgs): GenericMethodDecorator<TFunc> => {
      return function (classProto, methodName, descriptor) {
        const originalMethod = descriptor.value as TFunc
        if (!(originalMethod instanceof Function))
          throw new Error('Track decorator can only be applied to class methods')

        const decoratorOf: OperationDecoratorContext['decoratorOf'] = {
          classProto,
          methodName,
          descriptor,
          originalMethod
        }
        descriptor.value = wrapTryCatchFinallyPromisable(originalMethod, (ctx: OperationDecoratorContext) => {
          ctx.decoratorOf = decoratorOf
          ctx.trackArgs = trackArgs
          return hookProviders.map((h) => h.getTryCatchFinallyHook(ctx))
        })
      }
    }
    const decoratorUtils = {}
    for (const hookProvider of hookProviders) {
      Object.assign(decoratorUtils, hookProvider.getDecoratorUtils?.() || {})
    }

    return Object.assign(decorator, decoratorUtils) as any
  }

  /**
   * Creates decorator factory with default hook providers:
   * OperationErrorHandler,
   * OperationTree,
   * OperationDuration,
   * OperationFinallyHooks
   * @param notDefaultHookProviders extra (non default) hook providers
   * @returns decorator factory that can be used to decorate methods
   */
  static createDecoratorFactoryWithDefault<TOperationHookProviders extends OperationHookProvider[]>(
    ...notDefaultHookProviders: TOperationHookProviders
  ) {
    return OperationDecorator.createDecoratorFactory(
      OperationErrorHandler,
      OperationTree,
      OperationDuration,
      OperationFinallyHooks,
      ...notDefaultHookProviders
    )
  }

  static getOperationName(ctx: OperationDecoratorContext): string | undefined {
    return ctx.trackArgs?.operation || ctx.decoratorOf?.methodName
  }
}

export type OperationDecoratorContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> = TContext & {
  decoratorOf?: {
    classProto: any
    methodName: string
    descriptor: TypedPropertyDescriptor<any>
    originalMethod: FuncFromTryCatchFinallyContext<TContext>
  }
  trackArgs?: TrackArgsFromContext<TContext> & TrackArgs
}

export type ContextFromDecorator<TDecorator> = TDecorator extends { _contextType: infer TContext } ? TContext : never
