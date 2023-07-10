import { OperationContext } from './OperationContext'

/**
 * Get stack of operation contexts from root to current
 * @param ctx current operation context
 * @returns array of operation contexts
 */

export function getOperationsStack(ctx: OperationContext): OperationContext[] {
  const res: OperationContext[] = []
  let oper: OperationContext | undefined = ctx
  while (oper) {
    res.unshift(oper)
    oper = oper.parent
  }
  return res
}
