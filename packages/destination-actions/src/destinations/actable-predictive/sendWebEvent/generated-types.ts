// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier.
   */
  customer_id: string
  /**
   * Timestamp of event
   */
  datetime: string | number
  /**
   * type of interaction (page view, add to cart, etc).
   */
  interaction_type: string
  /**
   * UTM campaign parameter associated with event.
   */
  utm_campaign?: string
  /**
   * UTM medium parameter associated with event.
   */
  utm_medium?: string
  /**
   * UTM source parameter associated with event.
   */
  utm_source?: string
  /**
   * Dataset label, should be left as default unless directed otherwise
   */
  stream_key: string
}
