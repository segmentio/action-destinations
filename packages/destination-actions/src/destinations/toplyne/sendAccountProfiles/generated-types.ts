// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the account to send properties for
   */
  accountId: string
  /**
   * Creation time, for segment the event timestamp
   */
  creationTime: string
  /**
   * The properties of the account
   */
  accountProperties?: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will send upto 100 profiles in a single request. When disabled, the action will send 1 profile per request.
   */
  enable_batching?: boolean
}
