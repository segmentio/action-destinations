// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email to associate with the user
   */
  email?: string
  /**
   * The event name
   */
  event: string
  /**
   * Properties to send with the event
   */
  properties?: {
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
   * Traits inherited from the context object
   */
  traits?: {
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
