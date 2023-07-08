/* eslint-disable @typescript-eslint/no-explicit-any */
import { wrapPromisable } from './wrapPromisable'

/**
 * Configuration used by track decorator defining how the method execution should be tracked
 */
export interface TrackArgs {
  /**
   * Name of the operation to be tracked. By default the method name is used.
   * The name is used in log messages and stats metric - so it should be only using alphanumeric, underscores and dots
   */
  operation?: string
  /**
   * should the method execution be logged at current ctx.state (try/finally)?
   * False by default and true for Finally state
   */
  shouldLog?: (ctx: OperationContext) => boolean | void
  /**
   * should the method execution be tracked in stats at current ctx.state (try/catch/finally)?
   * False by default and true for Finally state
   */
  shouldStats?: (ctx: OperationContext) => boolean | void
  /**
   * Callback for preparing Error object to be logged/rethrown.
   * @param error error thrown by the tracked method
   * @param ctx operation context
   * @returns (optionally) error substitute to be rethrown/logged and (optionally) tags to be added to the error
   */
  onError?: (
    error: unknown,
    ctx: OperationContext
  ) =>
    | {
        error?: unknown
        tags?: string[]
      }
    | void
    | undefined

  [key: string]: any
}

/**
 * Creates decorator factory for tracking method execution
 * @param getTracker obtain the tracker instance from the instance of the class where the decorated method is defined or some global tracker
 * @returns decorator factory, which can be used to track method execution
 * @example
 * ```ts
 *    const track = createTrackDecoratorFactory<MyClass>((instance) => instance.tracker)
 *    class MyClass {
 *       tracker = new MyOperationTracker()
 *       // remove _ prefix in the line below. It is used to escape @ in the jsdoc
 *       _@track({ operation: 'myMethod' })
 *       myMethod(p1, p2) {
 *          //... method body
 *          return result
 *       }
 *    }
 * ```
 */
export function createTrackDecoratorFactory<TClass>(
  getTracker: (instance: TClass) => OperationTracker
): (trackArgs?: TrackArgs) => GenericMethodDecorator<TClass> {
  return (trackArgs) => {
    return function (_classProto, methodName, descriptor) {
      const originalMethod = descriptor.value
      if (!(originalMethod instanceof Function)) throw new Error('Track decorator can only be applied to class methods')
      descriptor.value = function (...methodArgs: any[]) {
        const targetInstance = this as TClass
        const tracker = getTracker(targetInstance)
        return tracker.runMethodAsTrackedOperation({
          method: originalMethod,
          methodName,
          methodArgs,
          methodThis: targetInstance,
          trackArgs
        })
      }
    }
  }
}

/**
 * Configuration of the track method execution
 */
export type TrackedRunArgs<TMethod extends (...methodArgs: any[]) => any> = {
  /**
   * Method to be executed
   */
  method: TMethod
  /**
   * Name of the method to be executed in the the class it belongs to
   */
  methodName: string
  /**
   * Arguments passed to the method to be executed
   */
  methodArgs: Parameters<TMethod>
  /**
   * Instance of the class, where the method to be executed is defined
   */
  methodThis: ThisParameterType<TMethod>
  /**
   * Tracking configuration for the method execution
   */
  trackArgs?: TrackArgs
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

  /**
   * Get stack of operation contexts from root to current
   * @param ctx current operation context
   * @returns array of operation contexts
   */
  getOperationsStack(ctx?: OperationContext): OperationContext[] {
    const res: OperationContext[] = []
    let oper: OperationContext | undefined = ctx || this.currentOperation
    while (oper) {
      res.unshift(oper)
      oper = oper.parent
    }
    return res
  }

  /**
   * Runs method as tracked operation
   * @param runArgs all the configuration of the method execution and tracking
   * @returns the result of the method execution
   */
  runMethodAsTrackedOperation<TMethod extends (...methodArgs: any[]) => any>(runArgs: TrackedRunArgs<TMethod>) {
    const ctx: OperationContext = {
      operation: runArgs.trackArgs?.operation || runArgs.methodName,
      state: 'try',
      trackArgs: runArgs.trackArgs,
      methodArgs: runArgs.methodArgs,
      tags: [],
      logs: [],
      onFinally: [],
      //traceId: this.currentOperation?.traceId || generateQuickGuid(),
      parent: this.currentOperation
    }

    return wrapPromisable(() => runArgs.method.apply(runArgs.methodThis, runArgs.methodArgs), {
      onTry: () => this.onOperationTry(ctx),
      onPrepareError: (err) => {
        ctx.state = 'catch'
        ctx.error = err
        this.onOperationPrepareError(ctx)
        return ctx.error
      },
      onFinally: (fin) => {
        ctx.state = 'finally'
        if ('error' in fin) {
          ctx.error = fin.error
        } else ctx.result = fin.result
        this.onOperationFinally(ctx)
      }
    })
  }

  /**
   * Defines if stats should happen for operation state by default when it's not explicitly specified in TrackArgs.
   * By default implementation it only returns true if operation is in `finally` state
   * @param ctx operation context
   * @returns
   */
  protected shouldStatsDefault(ctx: OperationContext): boolean {
    return ctx.state == 'finally'
  }

  /**
   * Defines if logging should happen for operation state by default when it's not explicitly specified in TrackArgs.
   * By default implementation it returns true (log on each state of the operation)
   * @param _ctx operation context
   * @returns
   */
  protected shouldLogDefault(_ctx: OperationContext): boolean {
    return true
  }

  /**
   * Invoked before running the tracked method
   * @param ctx operation context
   */
  protected onOperationTry(ctx: OperationContext): void {
    this._currentOperation = ctx
    ctx.startTime = Date.now()
    const shouldLog = ctx.trackArgs?.shouldLog ? ctx.trackArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
    if (shouldLog !== false) {
      const fullLogMessage = this.extractLogMessages(ctx)?.join('. ')
      this.logInfo(fullLogMessage)
    }
    const shouldStats = ctx.trackArgs?.shouldStats ? ctx.trackArgs?.shouldStats(ctx) : this.shouldStatsDefault(ctx)
    if (shouldStats !== false) {
      this.stats({ method: 'incr', metric: ctx.operation + '.try', value: 1 })
    }
  }

  /**
   * Prepares the error to be tracked and rethrown that was caught during execution of the tracked method.
   * The error can be modified or reassigned in ctx.error
   * @param ctx operation context
   */
  protected onOperationPrepareError(ctx: OperationContext): void {
    const origError = ctx.error
    const trArgs = ctx.trackArgs
    let trackedError = origError as TrackedError

    // try to get error wrapper from onError callback
    const errPrep = trArgs?.onError?.apply(this, [ctx.error, ctx])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (errPrep?.error && errPrep?.error != ctx.error) {
      trackedError = errPrep.error as TrackedError
      trackedError.underlyingError = origError
      trackedError.trackedContext = ctx
      //trackedError.tags = [...(origError.tags || [])] // if we want to inherit tags from original error
    }
    if (errPrep?.tags) {
      trackedError.tags = [...(trackedError.tags || []), ...errPrep.tags]
    }
    if (!trackedError.trackedContext)
      Object.defineProperty(trackedError, 'trackedContext', { value: ctx, enumerable: false }) //to make sure the operation context is not JSON.stringified with error
    ctx.error = trackedError
  }

  /**
   * Invokes in finally section after the tracked method is executed. At this point ctx.error or ctx.result are set
   * @param ctx operation context
   */
  protected onOperationFinally(ctx: OperationContext): void {
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

    const shouldLog = ctx.trackArgs?.shouldLog ? ctx.trackArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
    if (shouldLog !== false) {
      const fullLogMessage = (ctx.logs?.filter((t) => t) || []).join('. ')
      if (ctx.error) this.logError(fullLogMessage, ctx.error)
      else this.logInfo(fullLogMessage)
    }

    const shouldStats = ctx.trackArgs?.shouldStats ? ctx.trackArgs?.shouldStats(ctx) : this.shouldStatsDefault(ctx)
    if (shouldStats !== false) {
      const finallyTags = ctx.tags?.filter((t) => t) || []

      this.stats({ method: 'incr', metric: ctx.operation + '.finally', value: 1, extraTags: finallyTags })
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
    this.logError(`Operation ${ctx.operation} onFinally handler error: ${this.getErrorMessage(finallyHandlerError)}`)
  }

  /**
   * Extracts all stats tags for the operation's completion metrics
   * @param ctx operation context
   * @returns
   */
  protected extractTags(ctx: OperationContext): string[] {
    const res: string[] = []
    res.push(`error:${ctx.error ? 'true' : 'false'}`)
    if (ctx.error) {
      const error = ctx.error as TrackedError
      res.push(...(this.extractTagsFromError(error, ctx) || []))
    }

    return res
  }

  /**
   * Called by extractTags to extract tags from the error. The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to extract tags from
   * @param ctx operation context (may be different from the error.trackedContext)
   * @returns
   */
  protected extractTagsFromError(error: TrackedError, ctx: OperationContext): string[] {
    const res: string[] = []
    const errorContext = error.trackedContext
    res.push(`error_operation:${errorContext?.operation || ctx.operation}`)
    res.push(`error_class:${error?.constructor?.name || typeof error}`)
    // for all upstream operations add error tags
    if (error.tags /* && error.trackedContext == ctx */) res.push(...error.tags)

    return res
  }

  /**
   * Extracts all log messages for the operation log message on operation states (try|finally only)
   * @param ctx operation context
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  protected extractLogMessages(ctx: OperationContext): string[] {
    const res: string[] = []
    switch (ctx.state) {
      case 'try':
        res.push(this.getOperationTryMessage(ctx))
        break
      case 'finally':
        res.push(this.getOperationCompletedMessage(ctx))
        if (ctx.error) {
          const error = ctx.error as TrackedError
          res.push(...(this.getOperationErrorDetails(error, ctx) || []))
        }
        break
      default:
        break
    }
    return res
  }

  /**
   * Gets the log message of the operation attempt
   * @param ctx operation
   * @returns
   */
  protected getOperationTryMessage(ctx: OperationContext): string {
    const fullOperationName = this.getOperationsStack(ctx)
      .map((op) => op.operation)
      .join(' > ')
    return `${fullOperationName} starting...`
  }

  /**
   * Gets the first part of the operation's completion log message.
   * Should describe the name/path of operation, duration and whether it succeeded or failed.
   * It should not contain the details of failure, as it's covered by extractLogMessagesFromError
   * @param ctx operation context
   * @returns
   */
  protected getOperationCompletedMessage(ctx: OperationContext): string {
    const hasError = !!ctx.error
    const fullOperationName = this.getOperationsStack(ctx)
      .map((op) => op.operation)
      .join(' > ')
    return `${fullOperationName} ${hasError ? 'failed' : 'succeeded'} after ${ctx.duration} ms`
  }

  /**
   * Called by extractLogMessages to extract log messages from the error as well as its Underlying Error
   * The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to get log messages from
   * @param ctx current operation context (may be different from the error.trackedContext)
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  protected getOperationErrorDetails(error: TrackedError, ctx: OperationContext): string[] {
    const errorContext = error.trackedContext
    const logMessages: string[] = []
    logMessages.push(this.getErrorMessage(error, ctx))
    if (errorContext == ctx && error.underlyingError) {
      logMessages.push(`Underlying error: ${this.getErrorMessage(error.underlyingError, ctx)}`)
    }
    return logMessages
  }

  /**
   * Error parsing function. Override to customize error message for different error types
   * @param error error to get message from
   * @param _ctx current operation context
   * @returns
   */
  protected getErrorMessage(error: unknown, _ctx?: OperationContext): string {
    if (error instanceof Error) {
      const trError = error as TrackedError
      const errorClass = trError?.constructor?.name
      return `${errorClass || '[undefined]'}: ${trError.message}`
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

// function generateQuickGuid(): string {
//   return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
// }

type GenericMethodDecorator<This = unknown, TFunc extends (...args: any[]) => any = (...args: any) => any> = (
  target: This,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<TFunc>
) => TypedPropertyDescriptor<TFunc> | void

/**
 * Tracked Operation Context - contains all the information about the operation
 */
export type OperationContext = {
  /**
   * Operation name - used for metric naming and log messages. Can only use alphanumberics,dots or underscores
   */
  operation: string
  /**
   * Operation's current state (try/catch/finally)
   */
  state: 'try' | 'catch' | 'finally'
  // /**
  //  * TraceId - unique identifier of the operation shared accross parent/child operations
  //  */
  // traceId: string
  /**
   * track configuration provided in the tracked decorator factory
   */
  trackArgs?: TrackArgs
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
  onFinally: ((ctx: OperationContext) => void)[]
  /**
   * underlying function args (can be used for logging purposes)
   */
  methodArgs: unknown[]

  [key: string]: any
}

/**
 * Error object that contains tracked data
 */
export interface TrackedError extends Error {
  /**
   * Underlying error that this error wraps
   */
  underlyingError?: unknown
  /**
   * Operation context during which the error happened
   */
  trackedContext?: OperationContext
  /**
   * Tags to add to the operation completion metrics
   */
  tags?: string[]

  [key: string]: any
}
