/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TryCatchFinallyContext<
  TFunc extends (this: any, ...args: any[]) => any = (this: any, ...args: any[]) => any
> {
  func: TFunc
  funcArgs: Parameters<TFunc>
  funcThis: ThisParameterType<TFunc>
  result?: ReturnType<TFunc> | Awaited<ReturnType<TFunc>>
  error?: unknown
  stage: 'try' | 'success' | 'catch' | 'finally'
}

export interface TryCatchFinallyHook<
  TContext extends TryCatchFinallyContext<any> = TryCatchFinallyContext<(...args: any[]) => any>
> {
  onTry?(ctx: TContext): void | (() => void)
  onSuccess?(ctx: TContext): void | (() => void)
  onCatch?(ctx: TContext): void | (() => void)
  onFinally?(ctx: TContext): void | (() => void)

  /**
   * Defines the order of execution of the hook provider (default = 0, can be negative). The decorator will sort the hooks by priority before invoking them. The higher the number, the later the hook will be executed.
   * @param ctx
   */
  getPriority?(ctx: TContext): number | void
}

export type FuncFromTryCatchFinallyContext<TWrapContext extends TryCatchFinallyContext<any>> =
  TWrapContext extends TryCatchFinallyContext<infer TFunc> ? TFunc : never

export const DefaultHookPriority = 0 //Number.MAX_SAFE_INTEGER

/**
 *
 * @param func original function to wrap
 * @param getHooks provide set of hooks once for each original function execution
 * @param onHookError optional callback to handle errors in hooks and their callbacks. If not provided, the error will be thrown as is
 * @returns
 */
export function wrapTryCatchFinallyPromisable<
  TFunc extends (...args: any[]) => any,
  TContext extends TryCatchFinallyContext<TFunc> = TryCatchFinallyContext<TFunc>,
  THooks extends TryCatchFinallyHook<TContext>[] = TryCatchFinallyHook<TContext>[]
>(func: TFunc, getHooks: (ctx: TContext) => THooks, onHookError?: (e: unknown) => unknown | undefined): TFunc {
  type Hook = THooks[number]
  function forEachHook(hooks: THooks, inContext: TContext, doThis: (hook: Hook) => void | (() => void)) {
    const prioritizedHooks = Object.values(hooks).sort((h1, h2) => {
      const p1 = h1.getPriority ? h1.getPriority(inContext) : DefaultHookPriority
      const p2 = h2.getPriority ? h2.getPriority(inContext) : DefaultHookPriority
      return (p1 === undefined ? DefaultHookPriority : p1) - (p2 === undefined ? DefaultHookPriority : p2)
    })

    const postCallbacks: (() => void)[] = []
    for (const hook of prioritizedHooks) {
      try {
        const callback = doThis(hook)
        if (callback instanceof Function) postCallbacks.push(callback)
      } catch (hookError) {
        let errorToThrow = hookError
        if (onHookError) errorToThrow = onHookError(errorToThrow)
        if (errorToThrow) throw errorToThrow
      }
    }
    //invoke callbacks in reverse order, so the highest priority hook will run the last
    for (const callback of postCallbacks.reverse()) {
      try {
        callback()
      } catch (callbackError) {
        let errorToThrow = callbackError
        if (onHookError) errorToThrow = onHookError(errorToThrow)
        if (errorToThrow) throw errorToThrow
      }
    }
  }

  return function (this: ThisParameterType<TFunc>, ...funcArgs: Parameters<TFunc>): ReturnType<TFunc> {
    const ctx: TContext = {
      funcArgs: funcArgs,
      funcThis: this,
      func,
      stage: 'try'
    } as any
    let isPromise = false
    const hooks = getHooks(ctx)
    try {
      forEachHook(hooks, ctx, (hook) => hook.onTry?.(ctx))
      const funcResMayBePromise = func.apply(this, funcArgs)
      isPromise = isValuePromise(funcResMayBePromise)
      if (isPromise) {
        const wrappedPromise = (async () => {
          try {
            ctx.result = await funcResMayBePromise
            ctx.stage = 'success'
            forEachHook(hooks, ctx, (hook) => hook.onSuccess?.(ctx))
          } catch (error) {
            ctx.stage = 'catch'
            ctx.error = error
            forEachHook(hooks, ctx, (hook) => hook.onCatch?.(ctx))
            if (ctx.error) throw ctx.error
          } finally {
            ctx.stage = 'finally'
            forEachHook(hooks, ctx, (hook) => hook.onFinally?.(ctx))
          }
          return ctx.result as Awaited<ReturnType<TFunc>>
        })()
        return wrappedPromise as ReturnType<TFunc>
      }
      ctx.result = funcResMayBePromise
      ctx.stage = 'success'
      forEachHook(hooks, ctx, (hook) => hook.onSuccess?.(ctx))
    } catch (error) {
      ctx.stage = 'catch'
      ctx.error = error
      forEachHook(hooks, ctx, (hook) => hook.onCatch?.(ctx))
      if (ctx.error) throw ctx.error
    } finally {
      if (!isPromise) {
        ctx.stage = 'finally'
        forEachHook(hooks, ctx, (hook) => hook.onFinally?.(ctx))
      }
    }
    return ctx.result as ReturnType<TFunc>
  } as TFunc
}

// Copied from Typescript libs v4.5. Once we upgrade to v4.5, we can remove this
export type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T // non-object or non-thenable

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValuePromise<T = unknown>(obj: unknown): obj is Promise<T> {
  // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
  //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise
  // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return obj instanceof Object && 'then' in obj && typeof obj.then === 'function'
}
