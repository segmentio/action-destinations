interface WrapContext {
  [key: string]: unknown
}

/**
 * Wraps parameterless function execution in try/catch/finally allowing to define callback to be called in all those sections and return the result of the original function execution.
 * The value of this wrapper is the support of both types of original methods - sync and async
 * @param fn original function to wrap (parameterless)
 * @param args configuration of wrapped execution including all the callbacks
 * @returns result of execution of original function
 */
export function wrapPromisable<T>(
  fn: () => T,
  args: {
    onTry?(ctx: WrapContext): void
    onSuccess?(res: Awaited<T>, ctx: WrapContext): void
    onCatch?(error: unknown, ctx: WrapContext): Awaited<T>
    onPrepareError?(error: unknown, ctx: WrapContext): unknown
    onFinally?(res: { result: Awaited<T> } | { error: unknown }, ctx: WrapContext): void
  }
): T {
  const ctx: WrapContext = {}
  args.onTry?.(ctx)
  let finallyRes: { result: Awaited<T> } | { error: unknown } | undefined = undefined

  try {
    const res = fn()
    if (isPromise<Awaited<T>>(res))
      return (async () => {
        try {
          const resolvedResult = await res
          finallyRes = { result: resolvedResult }
          args.onSuccess?.(resolvedResult, ctx)
          return resolvedResult
        } catch (error) {
          // eslint-disable-next-line no-ex-assign
          if (args.onPrepareError) error = args.onPrepareError(error, ctx) || error
          finallyRes = { error }
          if (!args.onCatch) throw error
          return args.onCatch(error, ctx)
        } finally {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          args.onFinally?.(finallyRes!, ctx)
        }
      })() as any as T // eslint-disable-line @typescript-eslint/no-explicit-any -- to make the type checker happy

    finallyRes = { result: res as Awaited<T> }
    args.onSuccess?.(res as Awaited<T>, ctx)
    return res
  } catch (error) {
    // eslint-disable-next-line no-ex-assign
    if (args.onPrepareError) error = args.onPrepareError(error, ctx) || error
    finallyRes = { error }
    if (!args.onCatch) throw error
    return args.onCatch(error, ctx)
  } finally {
    if (finallyRes)
      // don't run it if it's a promise
      args.onFinally?.(finallyRes, ctx)
  }
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
function isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
  // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
  //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise
  // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return obj instanceof Object && 'then' in obj && typeof obj.then === 'function'
}
