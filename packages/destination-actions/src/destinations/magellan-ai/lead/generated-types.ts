// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The monetary value of this event, in the specified currency
   */
  value: number
  /**
   * ISO 4217 three-digit currency code (e.g., "USD", "CAD", "AUD")
   */
  currency: string
  /**
   * The unique ID for this generated lead
   */
  id?: string
  /**
   * The product ID associated with this lead
   */
  productId?: string
  /**
   * The number of items represented by this lead
   */
  quantity?: number
  /**
   * The type of lead
   */
  type?: string
  /**
   * The category of lead
   */
  category?: string
  /**
   * The IPv4 address of the end user (Note: Segment does not support collecting IPv6 addresses)
   */
  ip: string
  /**
   * The user agent of the end user (Note: not collected by the iOS Segment agent)
   */
  ua: string
}
