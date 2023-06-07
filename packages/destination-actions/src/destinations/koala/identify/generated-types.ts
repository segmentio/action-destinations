// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name
   */
  event: string
  /**
   * Traits to associate with the user
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  sent_at: string
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The device IP collected from the context
   */
  device_ip?: string
  /**
   * The Segment messageId
   */
  message_id: string
}
