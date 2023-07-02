/* eslint-disable @typescript-eslint/no-explicit-any */
//import { IntegrationError } from '@segment/actions-core'
import { wrapPromisable } from './wrapPromisable'

export interface TrackArgs {
  operation?: string
  log?: boolean
  stats?: boolean
  onError?: (error: unknown, ctx: OperationContext) => { error?: unknown; tags?: string[] }
}

/**
 * Creates decorator for tracking method execution
 * @param getTracker obtain the tracker instance from the instance of the class, where the decorated method is defined
 * @returns decorator factory, which can be used to track method execution
 */
export function createTrackableDecorator<TClass>(getTracker: (instance: TClass) => OperationTracker) {
  return function trackableDecorator(trackableArgs?: TrackArgs): GenericMethodDecorator<TClass> {
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

/**
 * Class that performs tracking of operation execution
 */
export abstract class OperationTracker {
  abstract logInfo(msg: string, metadata?: object): void

  abstract logError(msg: string, metadata?: object): void

  abstract stats<TStatsMethod extends StatsMethod>(args: StatsArgs<TStatsMethod>): void

  private _currentOperation?: OperationContext //once we upgrade to TS 4.3, we can use private field #currentOperation

  /**
   * Operation that is currently executed
   */
  get currentOperation(): OperationContext | undefined {
    return this._currentOperation
  }

  runOperation<R = void>(fn: () => R, operation: string, trArgs?: TrackArgs, funcArgs?: unknown[]): R {
    const ctx: OperationContext = {
      operation,
      trackingArgs: trArgs,
      funcArgs: funcArgs,
      tags: [],
      logs: [],
      onFinally: [],
      traceId: this.currentOperation?.traceId || generateQuickGuid(),
      parent: this.currentOperation
    }
    return wrapPromisable(fn, {
      onTry: () => this.onOperationTry(ctx),
      onPrepareError: (err) => {
        ctx.error = err
        this.onOperationPrepareError(ctx)
        return ctx.error
      },
      onFinally: (fin) => {
        if ('error' in fin) {
          ctx.error = fin.error
        } else ctx.result = fin.result
        this.onOperationFinally(ctx)
      }
    })
  }

  protected onOperationTry(ctx: OperationContext) {
    this._currentOperation = ctx
    if (ctx.trackingArgs?.log !== false) this.logInfo(`${ctx.operation} Starting...`)
    if (ctx.trackingArgs?.stats !== false) this.stats({ method: 'incr', metric: ctx.operation + '.try' })
    ctx.startTime = Date.now()
  }
  protected onOperationPrepareError(ctx: OperationContext) {
    const origError = ctx.error
    const trArgs = ctx.trackingArgs
    let trackableError = origError as TrackableError
    if (trackableError.trackableContext) return trackableError //if already has trackable context then return the error as is

    // try to get error wrapper from onError callback
    const errPrep = trArgs?.onError?.apply(this, [ctx.error, ctx])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (errPrep?.error) {
      trackableError = errPrep.error as TrackableError
      trackableError.underlyingError = origError
    }
    if (errPrep?.tags) {
      trackableError.tags = [...(trackableError.tags || []), ...(errPrep.tags || [])]
    }
    trackableError.trackableContext = ctx
  }
  protected onOperationFinally(ctx: OperationContext) {
    const start = ctx.startTime as number
    ctx.duration = Date.now() - start

    ctx.logs.push(...(this.extractLogMessages(ctx) || []))
    ctx.tags.push(...(this.extractTags(ctx) || []))

    // call onFinally hooks, which may modify the context (e.g. change tags/log messages)
    for (const onFinally of ctx.onFinally || []) {
      try {
        onFinally(ctx)
      } catch (finallyHandlerError) {
        this.onOperationFinallyHookError(finallyHandlerError, ctx)
      }
    }

    if (ctx.trackingArgs?.log !== false) {
      const fullLogMessage = (ctx.logs?.filter((t) => t) || []).join('. ')
      if (ctx.error) this.logError(fullLogMessage, ctx.error)
      else this.logInfo(fullLogMessage)
    }

    if (ctx.trackingArgs?.stats !== false) {
      const finallyTags = ctx.tags?.filter((t) => t) || []

      this.stats({ method: 'incr', metric: ctx.operation + '.finally', extraTags: finallyTags })
      this.stats({
        method: 'histogram',
        metric: ctx.operation + '.duration',
        value: ctx.duration as number,
        extraTags: finallyTags
      })
    }
    this._currentOperation = ctx.parent
  }

  /**
   * Handler of the error that happened in onFinally hook
   * @param finallyHandlerError error happened in onFinally hook
   * @param ctx current operation context
   */
  protected onOperationFinallyHookError(finallyHandlerError: unknown, ctx: OperationContext) {
    this.logError(
      `Operation ${ctx.operation} onFinally handler error (traceId ${ctx.traceId}): ${this.getErrorMessage(
        finallyHandlerError
      )}`
    )
  }

  /**
   * Extracts dd tags for the operation completion metric
   * @param ctx operation context
   * @returns
   */
  protected extractTags(ctx: OperationContext): string[] {
    const hasError = !!ctx.error
    const res: string[] = []
    res.push(`success:${hasError ? 'false' : 'true'}`)
    if (hasError) {
      const error = ctx.error as TrackableError
      res.push(...(this.extractTagsFromError(error, ctx) || []))
    }

    return res
  }
  protected extractTagsFromError(error: TrackableError, ctx: OperationContext): string[] {
    const res: string[] = []
    const errorContext = error.trackableContext
    res.push(`error_operation: ${errorContext?.operation || ctx.operation}`)
    res.push(`error_class:${error?.constructor?.name || typeof error}`)
    // for all upstream operations add error tags
    if (error.tags /* && error.trackableContext == ctx */) res.push(...error.tags)

    return res
  }

  protected extractLogMessages(ctx: OperationContext): string[] {
    const res: string[] = []
    const hasError = !!ctx.error
    const fullOperationName = getOperationsStack(ctx)
      .map((op) => op.operation)
      .join(' > ')
    res.push(
      `${fullOperationName} ${hasError ? 'failed' : 'succeeded'} after: ${ctx.duration} ms (traceId: ${ctx.traceId})`
    )

    if (hasError) {
      const error = ctx.error as TrackableError
      res.push(...(this.extractLogMessagesFromError(error, ctx) || []))
    }
    return res
  }
  protected extractLogMessagesFromError(error: TrackableError, ctx: OperationContext): string[] {
    const errorContext = error.trackableContext
    const logMessages: string[] = []
    logMessages.push(this.getErrorMessage(error))
    if (errorContext == ctx && error.underlyingError) {
      logMessages.push(`Underlying error: ${this.getErrorMessage(error.underlyingError)}`)
    }
    return logMessages
  }

  getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      const trError = error as TrackableError

      return trError.message
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return (error as any)?.toString?.() || 'unknown error'
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

/**
 * Trackable Operation Context - contains all the information about the operation
 */
export type OperationContext = {
  /**
   * Operation name - used for metric naming and log messages. Can only use alphanumberics,dots or underscores
   */
  operation: string
  /**
   * TraceId - unique identifier of the operation shared accross parent/child operations
   */
  traceId: string
  /**
   * arguments provided in the decorator
   */
  trackingArgs?: TrackArgs
  /**
   * Parent operation context - let you traverse the path of the operation
   */
  parent?: OperationContext
  /**
   * contains result of the operation's underlying function if it was executed successfully
   */
  result?: any
  /**
   * contains error of the operation's underlying function if it failed
   */
  error?: any
  /**
   * log messages collected during the operation that will be logged at the end of the operation
   */
  logs: string[]
  /**
   * tags collected during the operation that will be added to the operation completion metrics
   */
  tags: string[]
  /**
   * extra finally handlers of the operation that can be appended by the underlying function so it can add extra tags/log messages. E.g. add parameter of the function to the log in case of operation failure
   */
  onFinally?: ((ctx: OperationContext) => void)[]
  /**
   * underlying function args (can be used for logging purposes)
   */
  funcArgs?: unknown[]

  [key: string]: any
}

/**
 * Get stack of operation contexts from root to current
 * @param ctx current operation context
 * @returns array of operation contexts
 */
function getOperationsStack(ctx: OperationContext): OperationContext[] {
  const res: OperationContext[] = []
  let oper: OperationContext | undefined = ctx
  while (oper) {
    res.unshift(oper)
    oper = oper.parent
  }
  return res
}

/**
 * Error object that contains trackable data
 */
export interface TrackableError extends Error {
  //, Partial<IntegrationError>
  underlyingError?: unknown
  trackableContext?: OperationContext
  tags?: string[]
  [key: string]: any
}
