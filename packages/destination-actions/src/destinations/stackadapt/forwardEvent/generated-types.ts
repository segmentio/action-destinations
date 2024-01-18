// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Segment event type (page, track, etc.)
   */
  eventType?: string
  /**
   * IP address of the user
   */
  ip?: string
  /**
   * User-Agent of the user
   */
  userAgent?: string
  /**
   * Additional properties associated with the event.
   */
  eventProperties?: {
    [k: string]: unknown
  }
  /**
   * The title of the page where the event occurred.
   */
  title?: string
  /**
   * The URL of the page where the event occurred.
   */
  url?: string
  /**
   * The referrer of the page where the event occurred.
   */
  referrer?: string
  /**
   * UTM source parameter associated with even
   */
  utmSource?: string
  /**
   * Email address of the individual who triggered the conversion event.
   */
  email?: string
  /**
   * Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000.
   */
  phone?: string
  /**
   * First name of the individual who triggered the conversion event.
   */
  firstName?: string
  /**
   * Last name of the individual who triggered the conversion event.
   */
  lastName?: string
  /**
   * The revenue generated from the event.
   */
  revenue?: number
  /**
   * The ID of the order.
   */
  orderId?: string
  /**
   * The list of products purchased.
   */
  products?: {
    /**
     * The price of the item purchased.
     */
    price?: number
    /**
     * The quantity of the item purchased.
     */
    quantity?: number
    /**
     * An identifier for the item purchased.
     */
    productId?: string
    [k: string]: unknown
  }[]
  /**
   * The ID of the user in Segment
   */
  userId: string
}
