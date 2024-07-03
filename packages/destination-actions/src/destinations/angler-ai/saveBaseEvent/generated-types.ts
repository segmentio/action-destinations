// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique event identifier.
   */
  eventId: string
  /**
   * The IP address of the user.
   */
  ipAddress?: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * The timestamp when the event was triggered.
   */
  timestamp?: string
  /**
   * Identifiers for the user
   */
  identifiers: {
    /**
     * Segment User ID.
     */
    userId?: string
    /**
     * Segment anonymous ID.
     */
    anonymousId?: string
    /**
     * Client ID.
     */
    clientId: string
    /**
     * Facebook Pixel ID. This is a cookie which is unique to each user.
     */
    fbp?: string
    /**
     * Facebook Click ID. This is a cookie which is unique to each user.
     */
    fbc?: string
    /**
     * Google Analytics ID. This is a cookie which is unique to each user.
     */
    ga?: string
    [k: string]: unknown
  }
  /**
   * Page details to send with the event
   */
  page?: {
    /**
     * The URL where the event occurred.
     */
    url?: string
    /**
     * The referring URL if applicable.
     */
    referrer?: string
  }
  /**
   * Custom attributes for the event. Data should be specified as key:value pairs
   */
  customAttributes?: {
    [k: string]: unknown
  }
  /**
   * Customer details
   */
  customer?: {
    /**
     * The customer's email address.
     */
    email?: string
    /**
     * The customer's first name.
     */
    firstName?: string
    /**
     * The customer's last name.
     */
    lastName?: string
    /**
     * The unique phone number (E.164 format) for this customer.
     */
    phone?: string
    /**
     * The customer's date of birth.
     */
    dob?: string
  }
  /**
   * Cart details
   */
  cart?: {
    /**
     * A globally unique identifier for the cart.
     */
    id?: string
    /**
     * Decimal money amount.
     */
    totalAmount?: number
    /**
     * The currency code of the money.
     */
    currencyCode?: string
  }
  /**
   * Cart Line Item details
   */
  cartLines?: {
    /**
     * A globally unique identifier for the item.
     */
    id?: string
    /**
     * Identifier for the variant of the product
     */
    variantId?: string
    /**
     * The location of the image as a URL.
     */
    imageSrc?: string
    /**
     * The price of the product variant.
     */
    priceAmount?: number
    /**
     * The SKU (stock keeping unit) associated with the variant.
     */
    sku?: string
    /**
     * The product variant's title.
     */
    title?: string
    /**
     * The product variant's untranslated title.
     */
    untranslatedTitle?: string
    /**
     * The product's vendor name.
     */
    vendor?: string
    /**
     * The product type specified by the merchant.
     */
    type?: string
    /**
     * The relative URL of the product.
     */
    url?: string
    /**
     * Quantity of the item
     */
    quantity?: number
  }[]
  /**
   * The name of the event to track.
   */
  eventName: string
}
