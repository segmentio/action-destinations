// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * TODO - description for this field
   */
  data?: {
    /**
     * The type of event being sent to the Bing API.
     */
    eventType?: string
    /**
     * EventID for deduplication. Defaults to the Segment messageId.
     */
    eventId?: string
    /**
     * Event action for custom conversion goals, if used.
     */
    eventName?: string
    /**
     * The time the event occurred.
     */
    eventTime?: string
    /**
     * URL of the page, used for example: “destination URL” goals. Required for pageLoad events.
     */
    eventSourceUrl?: string
    /**
     * Page load id that links to 0+ custom events from the same page. Format as a v4 UUID.
     */
    pageLoadId?: string
    /**
     * Referrer of the page, used for example: "referral" remarketing lists.
     */
    referrerUrl?: string
    /**
     * Title of the page.
     */
    pageTitle?: string
    /**
     * Page keywords - SEO meta keyworls.
     */
    keywords?: string
    /**
     * Ad Storage Consent for GDPR compliance
     */
    adStorageConsent?: string
  }
  /**
   * A list of user identifiers associated with the event.
   */
  userData: {
    /**
     * User agent string of the client device.
     */
    clientUserAgent?: string
    /**
     * Guest user anonymous ID.
     */
    anonymousId?: string
    /**
     * Authenticated user id (anonymized) if user is logged in. Also used for ID sync
     */
    externalId?: string
    /**
     * Email address of the user. Accepts a clear text or hashed email address. Segment will ensure the email address is hashed before sending to Bing Ads.
     */
    em?: string
    /**
     * Phone number of the user. Accepts a clear text or hashed phone number. Segment will ensure the phone number is hashed before sending to Bing Ads.
     */
    ph?: string
    /**
     * IP address of the client device.
     */
    clientIpAddress?: string
    /**
     * Google Advertising ID for mobile app tracking.
     */
    gaid?: string
    /**
     * Identifier for Advertisers for iOS devices for mobile app tracking.
     */
    idfa?: string
    /**
     * Microsoft Last Click ID.
     */
    msclkid?: string
  }
  /**
   * Custom data to be sent to the Bing API. This can include additional properties that are not covered by the standard fields.
   */
  customData?: {
    /**
     * The category for custom conversion goals, if used.
     */
    eventCategory?: string
    /**
     * The label for custom conversion goals.
     */
    eventLabel?: string
    /**
     * The event value for custom conversion goals.
     */
    eventValue?: number
    /**
     * The query used by the user for a search results page.
     */
    searchTerm?: string
    /**
     * The unique identifier for the transaction. Required for purchase events.
     */
    transactionId?: string
    /**
     * Revenue value (float) to report variable revenue for goals, if used
     */
    value?: number
    /**
     * The currency of the event value, in ISO 4217 format.
     */
    currency?: string
    /**
     * A comma separated list of product IDs, or an array of IDs.
     */
    itemIds?: string[]
    /**
     * The type of page where the event occurred.
     */
    pageType?: string
    /**
     * Total value of the cart of purchase.
     */
    ecommTotalValue?: number
    /**
     * Category ID
     */
    ecommCategory?: string
  }
  /**
   * The list of items associated with the event. Must contain at least one item.
   */
  items?: {
    /**
     * The unique identifier for the item.
     */
    id?: string
    /**
     * The name of the item.
     */
    name?: string
    /**
     * The price of the item, after discounts.
     */
    price?: number
    /**
     * The quantity of the item.
     */
    quantity?: number
  }[]
  /**
   * Data specific to hotel events.
   */
  hotelData?: {
    /**
     * Total price of the booking, including taxes and fees.
     */
    totalPrice?: number
    /**
     * Price of the booking, not including taxes or fees.
     */
    basePrice?: number
    /**
     * The date of check-in for the hotel booking in the format YYYY-MM-DD
     */
    checkInDate?: string
    /**
     * The date of check-out for the hotel booking in the format YYYY-MM-DD
     */
    checkOutDate?: string
    /**
     * The number of nights the booking is for. Not required if you specify hct_checkout_date.
     */
    lengthOfStay?: number
    /**
     * The ID of the hotel as provided by the partner.
     */
    partnerHotelId?: string
    /**
     * Encrypted or obfuscated booking refrence number
     */
    bookingHref?: string
  }
  /**
   * Hidden field: The timestamp of the event.
   */
  timestamp: string
  /**
   * Enable batching for this action.
   */
  enable_batching?: boolean
  /**
   * The max number of events to include in each batch.
   */
  batch_size?: number
}
