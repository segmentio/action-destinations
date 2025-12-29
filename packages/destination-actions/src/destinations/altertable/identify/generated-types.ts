// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user
   */
  userId: string
  /**
   * The anonymous ID of the user
   */
  anonymousId: string
  /**
   * The context properties to send with the identify
   */
  context: {
    [k: string]: unknown
  }
  /**
   * The traits of the user
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the identification
   */
  timestamp: string | number
}
