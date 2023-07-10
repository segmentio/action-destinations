import { TrackArgs } from './OperationTracker'

/**
 * Tracked Operation Context - contains all the information about the operation
 */

export interface OperationContext {
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
   * extra finally handlers of the operation that can be appended by the underlying function so it can add extra tags/log messages. E.g. add parameter of the function to the log in case of operation failure
   */
  onFinally: ((ctx: OperationContext) => void)[]
  /**
   * underlying function args (can be used for logging purposes)
   */
  methodArgs: unknown[]

  [key: string]: any
}
