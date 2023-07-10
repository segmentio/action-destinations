/* eslint-disable @typescript-eslint/no-explicit-any */
import { OperationContext } from './OperationContext'
import { OperationTrackHooks } from './OperationTrackHooks'
import { TrackedError } from './TrackedError'
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
        error?: TrackedError
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
  abstract initHooks(): { [key: string]: OperationTrackHooks } | OperationTrackHooks[]
  _hooks: { [key: string]: OperationTrackHooks } | OperationTrackHooks[] | undefined
  get hooks(): { [key: string]: OperationTrackHooks } | OperationTrackHooks[] {
    //lazy initialization of hooks
    if (!this._hooks) this._hooks = this.initHooks() || []
    return this._hooks
  }

  forEachHook(handler: (hooks: OperationTrackHooks) => void, ctx: OperationContext) {
    const defaultPriority = 9999 //Number.MAX_SAFE_INTEGER
    const prioritizedHooks = Object.values(this.hooks).sort((h1, h2) => {
      const p1 = h1.getHookPriority ? h1.getHookPriority(ctx) : defaultPriority
      const p2 = h2.getHookPriority ? h2.getHookPriority(ctx) : defaultPriority
      return (p1 === undefined ? defaultPriority : p1) - (p2 === undefined ? defaultPriority : p2)
    })
    for (const hook of prioritizedHooks) {
      handler(hook)
    }
  }

  private _currentOperation?: OperationContext //once we upgrade to TS 4.3, we can use private field #currentOperation

  /**
   * Operation that is currently executed
   */
  get currentOperation(): OperationContext | undefined {
    return this._currentOperation
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
      onFinally: [],
      parent: this.currentOperation
    } as any

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
   * Invoked before running the tracked method
   * @param ctx operation context
   */
  onOperationTry(ctx: OperationContext): void {
    this.forEachHook((ext) => ext.beforeOperationTry?.(ctx), ctx)

    this._currentOperation = ctx
    ctx.startTime = Date.now()

    this.forEachHook((ext) => ext.afterOperationTry?.(ctx), ctx)
  }

  /**
   * Prepares the error to be tracked and rethrown that was caught during execution of the tracked method.
   * The error can be modified or reassigned in ctx.error
   * @param ctx operation context
   */
  onOperationPrepareError(ctx: OperationContext): void {
    this.forEachHook((ext) => ext.beforeOperationPrepareError?.(ctx), ctx)

    const origError = ctx.error
    const trArgs = ctx.trackArgs
    let trackedError = origError as TrackedError

    // try to get error wrapper from onError callback
    const errPrep = trArgs?.onError?.apply(this, [ctx.error, ctx])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (errPrep?.error && errPrep?.error != ctx.error) {
      trackedError = errPrep.error
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

    this.forEachHook((ext) => ext.afterOperationPrepareError?.(ctx), ctx)
  }

  /**
   * Invokes in finally section after the tracked method is executed. At this point ctx.error or ctx.result are set
   * @param ctx operation context
   */
  onOperationFinally(ctx: OperationContext): void {
    this.forEachHook((ext) => ext.beforeOperationFinally?.(ctx), ctx)

    // call onFinally hooks, which may modify the context (e.g. change tags/log messages)
    for (const onFinally of ctx.onFinally || []) {
      try {
        onFinally(ctx)
      } catch (finallyHandlerError) {
        this.onOperationFinallyHookError?.(finallyHandlerError, ctx)
      }
    }
    this._currentOperation = ctx.parent
    this.forEachHook((ext) => ext.afterOperationFinally?.(ctx), ctx)
  }

  /**
   * Handler of the error that happened in onFinally hook
   * @param finallyHandlerError error happened in onFinally hook
   * @param ctx current operation context
   */
  onOperationFinallyHookError?(finallyHandlerError: unknown, ctx: OperationContext): void
}

type GenericMethodDecorator<This = unknown, TFunc extends (...args: any[]) => any = (...args: any) => any> = (
  target: This,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<TFunc>
) => TypedPropertyDescriptor<TFunc> | void
