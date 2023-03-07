// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the account to send properties for
   */
  accountId: string
  /**
   * Toplyne calculates the creation time using the timestamp of the first event or group call
   */
  creationTime: string | number
  /**
   * The properties of the account
   */
  accountProperties?: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will send upto 100 accounts in a single request. When disabled, the action will send 1 account per request.
   */
  enable_batching?: boolean
}
