import { TryCatchFinallyContext, TryCatchFinallyHook } from './wrapTryCatchFinallyPromisable'
import { TrackedError } from './TrackedError'
import { OperationTree } from './OperationTree'
import { OperationDecoratorContext } from './OperationDecorator'
import { OperationDurationContext } from './OperationDuration'

export type OperationLoggerContext<TContext extends TryCatchFinallyContext = TryCatchFinallyContext> = TContext & {
  /**
   * log messages collected during the operation that will be logged at the end of the operation
   */
  logs: string[]
  /**
   * log details added to log messages of this operation
   */
  logMetadata?: Record<string, unknown>

  decoratorArgs?: OperationLoggerDecoratorArgs

  sharedContext: OperationLoggerSharedContext
}
export interface OperationLoggerSharedContext {
  logs: string[]
  /**
   * log details added to each log message
   */
  logMetadata?: Record<string, unknown>
}

export interface OperationLoggerDecoratorArgs {
  /**
   * should the method execution be logged at current ctx.state (try/finally)?
   * False by default and true for Finally state
   */
  shouldLog?: (ctx: OperationLoggerContext) => boolean | void
}

export abstract class OperationLogger implements TryCatchFinallyHook<OperationLoggerContext> {
  static getTryCatchFinallyHook(_ctx: OperationLoggerContext): TryCatchFinallyHook<OperationLoggerContext> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _inheritecClass = this as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return new _inheritecClass()
  }

  abstract logInfo(msg: string, metadata?: object): void

  abstract logError(msg: string, metadata?: object): void

  onTry(ctx: OperationLoggerContext) {
    ctx.logs = []
    if (!ctx.sharedContext.logs) ctx.sharedContext.logs = []
    return () => {
      const shouldLog = ctx.decoratorArgs?.shouldLog ? ctx.decoratorArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
      if (shouldLog !== false) {
        const fullLogMessage = this.getOperationLogMessages(ctx)?.join('. ')
        this.logInfo(
          fullLogMessage,
          ctx.logMetadata || ctx.sharedContext.logMetadata
            ? { ...ctx.sharedContext.logMetadata, ...ctx.logMetadata }
            : undefined
        )
      }
    }
  }

  /**
   * Defines if logging should happen for operation state by default when it's not explicitly specified in DecoratorArgs.
   * By default implementation it returns true (log on each state of the operation)
   * @param _ctx operation context
   * @returns
   */
  shouldLogDefault(_ctx: OperationLoggerContext): boolean {
    return true
  }
  /**
   * Extracts all log messages for the operation log message on operation states (try|finally only)
   * @param ctx operation context
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  getOperationLogMessages(ctx: OperationLoggerContext): string[] {
    const res: string[] = []
    switch (ctx.stage) {
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
  getOperationTryMessage(ctx: OperationLoggerContext): string {
    return `${this.getOperationName(ctx)} starting...`
  }

  getOperationName(ctx: OperationLoggerContext): string {
    const fullOperationName = OperationTree.getOperationsStack(ctx)
      .map((op: OperationLoggerContext & OperationDecoratorContext) => {
        return (
          op.decoratorArgs?.operation ||
          op.decoratorOf?.methodName ||
          op.decoratorOf?.originalMethod?.name ||
          '<Anonymous operation>'
        )
      })
      .join(' > ')
    return fullOperationName
  }

  /**
   * Gets the first part of the operation's completion log message.
   * Should describe the name/path of operation, duration and whether it succeeded or failed.
   * It should not contain the details of failure, as it's covered by extractLogMessagesFromError
   * @param ctx operation context
   * @returns
   */
  getOperationCompletedMessage(ctx: OperationLoggerContext): string {
    const hasError = !!ctx.error
    const fullOperationName = this.getOperationName(ctx)
    const duration = (ctx as OperationDurationContext).duration
    if (duration !== undefined) return `${fullOperationName} ${hasError ? 'failed' : 'succeeded'} after ${duration} ms`
    else return `${fullOperationName} ${hasError ? 'failed' : 'succeeded'}`
  }

  /**
   * Called by extractLogMessages to extract log messages from the error as well as its Underlying Error
   * The error may have happened on the child operation (in this case error.trackedContext != ctx)
   * @param error error to get log messages from
   * @param ctx current operation context (may be different from the error.trackedContext)
   * @returns list of log messages (will be concatenated with '. ' in the result log message)
   */
  getOperationErrorDetails(error: TrackedError, ctx: OperationLoggerContext): string[] {
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
  getErrorMessage(error: unknown, _ctx?: OperationLoggerContext): string {
    if (error instanceof Error) {
      const trError = error as TrackedError
      const errorClass = trError?.constructor?.name
      return `${errorClass || '[undefined]'}: ${trError.message}`
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return (error as any)?.toString?.() || 'unknown error'
  }

  onFinally(ctx: OperationLoggerContext) {
    ctx.logs.push(...(this.getOperationLogMessages(ctx) || []))
    // somewhere here ctx.onFinally hooks are triggered
    return () => {
      const shouldLog = ctx.decoratorArgs?.shouldLog ? ctx.decoratorArgs?.shouldLog(ctx) : this.shouldLogDefault(ctx)
      if (shouldLog !== false) {
        const fullLogMessage = (ctx.sharedContext.logs?.filter((t) => t) || [])
          .concat(...(ctx.logs || []))
          .filter((t) => t)
          .join('. ')
        const logDetails =
          ctx.logMetadata || ctx.sharedContext.logMetadata
            ? { ...ctx.sharedContext.logMetadata, ...ctx.logMetadata }
            : undefined
        if (ctx.error) this.logError(fullLogMessage, { error: ctx.error, ...logDetails })
        else this.logInfo(fullLogMessage, logDetails)
      }
    }
  }
}
