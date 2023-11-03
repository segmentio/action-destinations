// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id. (Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
   */
  userId: string
  /**
   * The type of the event
   */
  type: string
  /**
   * The data to be sent to GWEN
   */
  data?: {
    [k: string]: unknown
  }
}
