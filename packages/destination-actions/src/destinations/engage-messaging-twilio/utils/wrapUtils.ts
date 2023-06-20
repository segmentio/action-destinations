/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatsClient } from '@segment/actions-core/src/destination-kit';



export type StatsMethod = keyof Pick<StatsClient, 'incr' | 'histogram' | 'set'>;
export type StatsArgs<TStatsMethod extends StatsMethod = StatsMethod> = {
  method?: TStatsMethod;
  metric: string;
  value?: number;
  extraTags?: string[];
};



// export interface IErrorDetails extends Error {
//   tags?: string[]
//   stats?: StatsArgs[]
//   extraLogMessages?: string[]
// }

// export function rethrowError(error: unknown, addDetails?: IErrorDetails) {
//   if (error instanceof Error && addDetails) {
//     const errorDetails = error as IErrorDetails
//     errorDetails.tags = (errorDetails.tags || []).concat(addDetails.tags || [])
//     errorDetails.stats = (errorDetails.stats || []).concat(addDetails.stats || [])
//     errorDetails.extraLogMessages = (errorDetails.extraLogMessages || []).concat(addDetails.extraLogMessages || [])
//   }
//   throw error


// export function createWrapPromisable<TFunc extends (this:any, ...args:any[])=>any >(
//   fn: TFunc,
//   args: {
//     onStart?(): void;
//     onSuccess?(res: Awaited<ReturnType<TFunc>>): void;
//     onCatch?(error: unknown): Awaited<ReturnType<TFunc>>;
//     onFinally?(res: { result: Awaited<ReturnType<TFunc>>; } | { error: unknown; }): void;
//   }
// ): TFunc
// {
//   type TFuncRes = ReturnType<TFunc>
//   type TFuncArgs = Parameters<TFunc>
//   type TFuncThis = Parameters<TFunc>

//   // (async () => {
//   //   try {
//   //     const unpromiseRes = await res;
//   //     finallyRes = { result: unpromiseRes };
//   //     args.onSuccess?.(unpromiseRes);
//   //     return unpromiseRes;
//   //   } catch (error) {
//   //     finallyRes = { error };
//   //     if (!args.onCatch)
//   //       throw error;
//   //     return args.onCatch(error);
//   //   } finally {
//   //     args.onFinally?.(finallyRes!);
//   //   }
//   // })() as any as TFuncRes; // eslint-disable-line @typescript-eslint/no-explicit-any -- to make the type checker happy


//   const wrapperRes = function wrapped(this: TFuncThis, ..._funcArgs: TFuncArgs): TFuncRes {
//     args.onStart?.();
//     let finallyRes: { result: Awaited<TFuncRes>; } | { error: unknown; } | undefined = undefined;

//     try {
//       const res = fn.apply(this, _funcArgs)
//       if (isPromise<AwaitedShallow<TFuncRes>>(res))
//       {
//         return new Promise((resolve, reject)=>{
//           res.then(resolved=>{}, rejected=>{})
//         }
//         // const awaitPromise = async ():Promise<AwaitedShallow<TFuncRes>> => {
//         //   wrapped.call(this)
//         // }
//         // return awaitPromise() as any
//       }

//       finallyRes = { result: res as Awaited<TFuncRes> };
//       args.onSuccess?.(res as Awaited<TFuncRes>);
//       return res;
//     } catch (error) {
//       finallyRes = { error };
//       if (!args.onCatch)
//         throw error;
//       return args.onCatch(error);
//     } finally {
//       if (finallyRes)
//         // don't run it if it's a promise
//         args.onFinally?.(finallyRes);
//     }
//   }
//   return wrapperRes as any
// }

// // Copied from Typescript libs v4.5. Once we upgrade to v4.5, we can remove this
// export type Awaited<T> = T extends null | undefined ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
//   : T extends object & { then(onfulfilled: infer F, ...args: infer _): any; } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
//   ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
//   ? Awaited<V> // recursively unwrap the value
//   : never // the argument to `then` was not callable
//   : T; // non-object or non-thenable

// export type AwaitedShallow<T extends Promise<any>> = T extends Promise<infer TAwaited> ? TAwaited : T;

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
//   // `obj instanceof Promise` is not reliable since it can be a custom promise object from fetch lib
//   //https://stackoverflow.com/questions/27746304/how-to-check-if-an-object-is-a-promise
//   // for whatever reason it gave me error "Property 'then' does not exist on type 'never'." so i have to use ts-ignore
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore
//   return obj instanceof Object && 'then' in obj && typeof obj.then === 'function';
// }


// export function createWrapPromisable<TFunc extends (this:any, ...args:any)=>any >(_func:TFunc, wrapArgs:Parameters<typeof wrapPromisable>[1]): TFunc
// {
//   const wrappedFunc =  function(this: ThisParameterType<TFunc>, ...funcArgs:Parameters<TFunc>): ReturnType<TFunc> {
//     return wrapPromisable(() => _func.apply(this, funcArgs), wrapArgs);
//   }
//   return wrappedFunc as any as TFunc
// } 





// export function trackableMethod(_args:TrackableMethodArgs): MethodDecorator
// {
//   return function (_target, _propertyKey, _descriptor){
//     const originalMethod = _descriptor.value as Function;
//     _descriptor.value = wrapPromisable(originalMethod.bind(_target), {}
    
//     function (...args: unknown[]) {
//       const argsStr = args.map((arg) => JSON.stringify(arg)).join(', ');
//       const className = _target.constructor.name;
//       const methodName = _propertyKey.toString();
//       const metric = _args.metric || `${className}.${methodName}`;
//       const tags = [`method:${className}.${methodName}`];
//       const statsArgs: StatsArgs[] = [{ metric, extraTags: tags }];
//       const extraLogMessages: string[] = [`method:${className}.${methodName}(${argsStr})`];
//       const errorDetails: IErrorDetails = { tags, stats: statsArgs, extraLogMessages };
//       try {
//         _args.onStart?.()
//         const result = originalMethod.apply(this, args);
//         _args.onSuccess?.()
//         return result;
//       } catch (error) {
//         _args.onError?.(error)
//         errorDetails.tags?.push('error');
//         errorDetails.stats?.push({ metric, extraTags: ['error'] });
//         errorDetails.extraLogMessages?.push(`error:${error}`);
//         rethrowError(error, errorDetails);
//       } finally {
//         _args.onFinally?.()
//       }
//     };
//   }
// }