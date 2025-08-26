// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier for the user
   */
  user_id: string
  /**
   * The type of async operation to perform
   */
  operation_type: string
  /**
   * Additional data for the operation
   */
  data?: {
    [k: string]: unknown
  }
}
