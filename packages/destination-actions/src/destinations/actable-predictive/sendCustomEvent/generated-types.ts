// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier.
   */
  customer_id: string
  /**
   * Timestamp of when the custom event occured.
   */
  timestamp: string | number
  /**
   * Send an object of custom properties to Actable Predictive for custom data modeling.
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Dataset label, should be left as default unless specified otherwise.
   */
  stream_key: string
}
