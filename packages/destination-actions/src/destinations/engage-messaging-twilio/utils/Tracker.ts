/* eslint-disable @typescript-eslint/no-explicit-any */
import { IntegrationError } from '@segment/actions-core'
import { wrapPromisable } from './wrapPromisable'
// import { IntegrationError, PayloadValidationError, RequestOptions } from '@segment/actions-core'
// import { Logger, StatsClient, StatsContext } from '@segment/actions-core/src/destination-kit'

export interface TrackArgs {
  operation?: string
  log?: boolean
  stats?: boolean
  onError?: (error: unknown) => { error?: unknown; tags?: string[] }
}

export function createTrackableDecorator<TClass>(getTracker: (instance: TClass) => Tracker) {
  return function trackable(trackableArgs?: TrackArgs): GenericMethodDecorator<TClass> {
    return function (_classProto, methodName, descriptor) {
      const originalMethod = descriptor.value
      if (!originalMethod) throw new Error('trackable decorator can only be applied to methods')
      descriptor.value = function (...fnArgs: any[]) {
        const targetInstance = this as TClass
        const tracker = getTracker(targetInstance)
        return tracker.runOperation(
          () => {
            const result = originalMethod.apply(targetInstance, fnArgs)
            return result
          },
          trackableArgs?.operation || methodName,
          trackableArgs,
          fnArgs
        )
      }
    }
  }
}

export abstract class Tracker {
  abstract logInfo(...msgs: string[]): void

  abstract logError(error: unknown, ...msgs: string[]): void

  abstract stats<TStatsMethod extends StatsMethod>(args: StatsArgs<TStatsMethod>): void

  currentOperation?: TrackableOperationContext

  runOperation<R = void>(fn: () => R, operation: string, trArgs?: TrackArgs, _funcArgs?: unknown[]): R {
    const ctx: TrackableOperationContext = {
      operation,
      tags: [],
      traceId: generateQuickGuid(),
      parent: this.currentOperation
    }
    return wrapPromisable(fn, {
      onTry: () => this.onOperationTry(ctx),
      onPrepareError: (err) => this.onOperationPrepareError(err, ctx, trArgs),
      onFinally: (fin) => this.onOperationFinally(fin, ctx)
    })
  }

  protected onOperationTry(ctx: TrackableOperationContext) {
    this.currentOperation = ctx
    this.logInfo(`${ctx.operation} Starting...`)
    this.stats({ method: 'incr', metric: ctx.operation + '.try' })
    ctx['startTime'] = Date.now()
  }
  protected onOperationPrepareError(err: unknown, ctx: TrackableOperationContext, trArgs?: TrackArgs): unknown {
    const originalError = err
    let trackableError = err as ErrorWithTrackableContext
    let errorContext = trackableError.trackableContext
    if (errorContext) return trackableError //if already has trackable context then return the error as is

    errorContext = ctx
    errorContext.originalError = originalError
    if (trArgs?.onError) {
      const errRes = trArgs.onError.apply(this, [err])
      errorContext.tags = errRes.tags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackableError = (errRes.error as any) || err
    }
    trackableError.trackableContext = errorContext
    return trackableError
  }
  protected onOperationFinally(fin: { error: unknown } | { result: any }, ctx: TrackableOperationContext) {
    const start = ctx['startTime'] as number
    const duration = Date.now() - start
    const finallyTags = [...(ctx.tags || [])]
    finallyTags.push(`success:${'error' in fin ? 'false' : 'true'}`)
    if ('result' in fin) {
      this.logInfo(`${ctx.operation} Success. Duration: ${duration} ms`)
      // this.stats({ method: 'incr', metric: operation + '.success' })
    } else {
      const error = fin.error as ErrorWithTrackableContext
      const { trackableContext } = error
      this.logError(error, `${ctx.operation} Failed. Duration: ${duration} ms`)
      const isErrorInCurrentOperation = trackableContext?.operation == ctx.operation //indicates if the error happened during this operation (not underlying trackable operation)
      if (isErrorInCurrentOperation && trackableContext?.originalError && trackableContext.originalError != error) {
        this.logError(trackableContext.originalError, `${ctx.operation} Underlying error`)
      }

      const errorCode = error instanceof IntegrationError ? error.code : error?.constructor?.name || 'unknown'
      finallyTags.push(`error_operation: ${trackableContext?.operation || ctx.operation}`, `error:${errorCode}`)
      if (trackableContext?.tags) finallyTags.push(...trackableContext.tags)
      // this.stats({ method: 'incr', metric: operation + '.catch', extraTags: finallyTags })
    }
    this.stats({ method: 'incr', metric: ctx.operation + '.finally', extraTags: finallyTags })
    this.stats({ method: 'histogram', metric: ctx.operation + '.duration', value: duration, extraTags: finallyTags })
    this.currentOperation = ctx.parent
  }
}

export type StatsMethod = 'incr' | 'histogram' | 'set'

export type StatsArgs<TStatsMethod extends StatsMethod = StatsMethod> = {
  method?: TStatsMethod
  metric: string
  value?: number
  extraTags?: string[]
}

function generateQuickGuid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

type GenericMethodDecorator<This = unknown, TFunc extends (...args: any[]) => any = (...args: any) => any> = (
  target: This,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<TFunc>
) => TypedPropertyDescriptor<TFunc> | void

export type TrackableOperationContext = {
  operation: string
  tags?: string[]
  originalError?: unknown
  parent?: TrackableOperationContext
  traceId: string
  [key: string]: unknown
}

export type ErrorWithTrackableContext = Error & {
  trackableContext?: TrackableOperationContext & { originalError?: unknown }
}
