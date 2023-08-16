import { ContextFromHookProviders, FuncFromHookProviders, OperationHookProvider } from './OperationDecorator'
import { TryCatchFinallyHook, TryCatchFinallyContext } from './wrapTryCatchFinallyPromisable'

type OperationTreeContext<TParentContext extends TryCatchFinallyContext = TryCatchFinallyContext> = TParentContext & {
  parent?: OperationTreeContext<TParentContext>
  sharedContext: {}
}

/**
 * stateless hook that allows Parent/Child operations tracking and shared context between them
 */
export class OperationTree {
  static getTryCatchFinallyHook(_ctx: OperationTreeContext): TryCatchFinallyHook<OperationTreeContext> {
    // we use singleton so it does not create new instance for each function execution
    return this
  }
  static getPriority() {
    return -1
  }
  static onTry(ctx: OperationTreeContext) {
    const parent = this.getCurrentOperationFromContext(ctx)
    ctx.sharedContext = parent?.sharedContext || {}
    ctx.parent = parent
    this.setCurrentOperationToContext(ctx, ctx)
  }
  static onFinally(ctx: OperationTreeContext) {
    return () => {
      this.setCurrentOperationToContext(ctx, ctx.parent)
    }
  }
  static getCurrentOperationFromTrackedClassInstance<TClassInstance>(classInstance: TClassInstance) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (classInstance as any)?.currentOperation as OperationTreeContext
  }
  static getCurrentOperationFromContext(ctx: OperationTreeContext) {
    return ctx.funcThis.currentOperation as OperationTreeContext
  }
  protected static setCurrentOperationToContext(
    ctx: OperationTreeContext,
    newCurrentOperation: OperationTreeContext | undefined
  ) {
    ctx.funcThis.currentOperation = newCurrentOperation
  }

  static getOperationsStack<TContext extends OperationTreeContext>(ctx: TContext): TContext[] {
    const stack: TContext[] = []
    let current = ctx
    while (current) {
      stack.unshift(current)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current = current.parent as TContext
    }
    return stack
  }

  static getDecoratorUtils() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getCurrentOperation(classInstance: any): OperationTreeContext | undefined {
        return classInstance?.currentOperation
      }
    }
  }
}

export type CanGetCurrentOperation<TOperationHookProviders extends OperationHookProvider[]> = {
  getCurrentOperation(
    classInstance: ThisParameterType<FuncFromHookProviders<TOperationHookProviders>>
  ): ContextFromHookProviders<TOperationHookProviders> | undefined
}
