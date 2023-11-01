// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of data stream this data belongs in. This can either be a web stream or a mobile app stream (iOS or Android). Possible values: "Web" (default) and "Mobile App".
   */
  data_stream_type?: string
  /**
   * Uniquely identifies a specific installation of a Firebase app. This value needs to be retrieved through the Firebase SDK. **Required for mobile app streams.**
   */
  app_instance_id?: string
  /**
   * Uniquely identifies a user instance of a web client. **Required for web streams.**
   */
  client_id?: string
  /**
   * A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier.
   */
  user_id?: string
  /**
   * A Unix timestamp (in microseconds) for the time to associate with the event. Segment will convert to Unix if not already converted. Events can be backdated up to 3 calendar days based on the property's timezone.
   */
  timestamp_micros?: string
  /**
   * Store or affiliation from which this transaction occurred (e.g. Google Store).
   */
  affiliation?: string
  /**
   * Coupon code used for a purchase.
   */
  coupon?: string
  /**
   * Currency of the items associated with the event, in 3-letter ISO 4217 format.
   */
  currency: string
  /**
   * The list of products purchased.
   */
  items: {
    /**
     * Identifier for the product being purchased.
     */
    item_id?: string
    /**
     * Name of the product being purchased.
     */
    item_name?: string
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location.
     */
    affiliation?: string
    /**
     * Coupon code used for a purchase.
     */
    coupon?: string
    /**
     * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
     */
    currency?: string
    /**
     * Monetary value of discount associated with a purchase.
     */
    discount?: number
    /**
     * The index/position of the item in a list.
     */
    index?: number
    /**
     * Brand associated with the product.
     */
    item_brand?: string
    /**
     * Product category.
     */
    item_category?: string
    /**
     * Product category 2.
     */
    item_category2?: string
    /**
     * Product category 3.
     */
    item_category3?: string
    /**
     * Product category 4.
     */
    item_category4?: string
    /**
     * Product category 5.
     */
    item_category5?: string
    /**
     * The ID of the list in which the item was presented to the user.
     */
    item_list_id?: string
    /**
     * The name of the list in which the item was presented to the user.
     */
    item_list_name?: string
    /**
     * Variant of the product (e.g. Black).
     */
    item_variant?: string
    /**
     * The location associated with the item.
     */
    location_id?: string
    /**
     * Price of the product being purchased, in units of the specified currency parameter.
     */
    price?: number
    /**
     * Item quantity.
     */
    quantity?: number
  }[]
  /**
   * The unique identifier of a transaction.
   */
  transaction_id: string
  /**
   * Shipping cost associated with the transaction.
   */
  shipping?: number
  /**
   * Total tax associated with the transaction.
   */
  tax?: number
  /**
   * The monetary value of the event.
   */
  value?: number
  /**
   * The user properties to send to Google Analytics 4. You must create user-scoped dimensions to ensure custom properties are picked up by Google. See Google’s [Custom user properties](https://support.google.com/analytics/answer/9269570) to learn how to set and register user properties.
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * The amount of time a user interacted with your site, in milliseconds. Google only counts users who interact with your site for a non-zero amount of time. By default, Segment sets engagement time to 1 so users are counted.
   */
  engagement_time_msec?: number
  /**
   * The event parameters to send to Google Analytics 4.
   */
  params?: {
    [k: string]: unknown
  }
}
