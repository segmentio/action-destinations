// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID in Segment
   */
  userId: string
  /**
   * Number to send SMS to when testing
   */
  toNumber?: string
  /**
   * Which number to send SMS from
   */
  fromNumber: string
  /**
   * Message to send
   */
  body: string
  /**
   * Additional custom arguments that will be opaquely sent back on webhook events
   */
  customArgs?: {
    [k: string]: unknown
  }
  /**
   * Whether or not the message should actually get sent.
   */
  send?: boolean
}
