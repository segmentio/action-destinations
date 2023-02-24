// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user to send events for
   */
  userId: string
  /**
   * The ID of the account to send events for
   */
  accountId?: string
  /**
   * The name of the event to send
   */
  eventName: string
  /**
   * The timestamp of the event
   */
  timestamp: string | number
  /**
   * The properties of the event
   */
  eventProperties?: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will send upto 500 events in a single request. When disabled, the action will send 1 event per request.
   */
  enable_batching?: boolean
}
