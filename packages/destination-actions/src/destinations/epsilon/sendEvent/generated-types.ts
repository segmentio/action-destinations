// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the message. Used for cache busting.
   */
  id: string
  /**
   * The namespace of the Mobile App.
   */
  appId: string
  /**
   * The name of the event to send to Epsilon.
   */
  dtm_event: string
  /**
   * The version of the Mobile App.
   */
  version: string
  /**
   * Form ID used in Epsilon’s system to identify app visits vs. conversions.
   */
  dtm_fid: string
  /**
   * Promo ID used in Epsilon’s system to identify the promotion associated with the event.
   */
  dtm_promo_id?: string
  /**
   * Unique identifiers for the user.
   */
  identifiers: {
    /**
     * Mobile Device ID (IDFV or Google App Set ID).
     */
    deviceID?: string
    /**
     * Mobile Ad ID (IDFA or Google Add ID).
     */
    advertisingId?: string
    /**
     * User agent of the mobile device.
     */
    dtm_user_agent?: string
    /**
     * IP address of the user.
     */
    dtm_user_ip?: string
    /**
     * Accepts hashed or unhashed emails. Segment will ensure that a non hashed email is hashed before being sent to Epsilon
     */
    dtm_email_hash?: string
    /**
     * Accepts hashed or unhashed mobile numbers. Segment will ensure that a non hashed mobile number is hashed before being sent to Epsilon
     */
    dtm_mobile_hash?: string
    /**
     * Unique identifier for the user.
     */
    dtm_user_id?: string
  }
  /**
   * Type of the device (e.g., iOS, Android).
   */
  deviceType: string
  /**
   * Department of the product.
   */
  dtmc_department?: string
  /**
   * Category of the product.
   */
  dtmc_category?: string
  /**
   * Sub-category of the product.
   */
  dtmc_sub_category?: string
  /**
   * Unique identifier for the product
   */
  dtmc_product_id?: string
  /**
   * Brand of the product.
   */
  dtmc_brand?: string
  /**
   * Manufacturer Universal Product Code for the product.
   */
  dtmc_upc?: string
  /**
   * Manufacturer Model Part Number for the product.
   */
  dtmc_mpn?: string
  /**
   * Unique identifier for the transaction.
   */
  dtmc_transaction_id: string
  /**
   * Contains the total purchase price in decimal format. Do not include any tax or shipping costs.
   */
  dtm_conv_val?: number
  /**
   * An array of all items in the conversion.
   */
  dtm_items: {
    /**
     * Unique identifier / SKU for the product.
     */
    product_id: string
    /**
     * Unit cost / price for 1 unit of the item.
     */
    item_amount: number
    /**
     * number of SKU items in the transaction.
     */
    item_quantity: number
    /**
     * Discount value from the original amount.
     */
    item_discount?: number
    [k: string]: unknown
  }[]
  /**
   * Currency of the transaction. Use ISO 4217 currency codes (e.g., USD, EUR).
   */
  dtm_conv_curr?: string
  /**
   * Differentiate between types of online purchases (Delivery, Pickup, etc.)
   */
  dtmc_conv_type?: string
  /**
   * For Pickup conversions, denote the store location of the pickup.
   */
  dtmc_conv_store_location?: string
}
