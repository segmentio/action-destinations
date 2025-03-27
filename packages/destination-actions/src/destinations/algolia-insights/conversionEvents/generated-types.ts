// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Sub-type of the event, "purchase" or "addToCart".
   */
  eventSubtype?: string
  /**
   * Populates the ObjectIDs field in the Algolia Insights API. An array of objects representing the purchased items. Each object must contain a product_id field.
   */
  products: {
    product_id: string
    price?: number
    quantity?: number
    discount?: number
    queryID?: string
  }[]
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was purchased.
   */
  queryID?: string
  /**
   * The ID associated with the user.
   */
  userToken: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string
  /**
   * The value of the cart that is being converted.
   */
  value?: number
  /**
   * Currency of the objects associated with the event in 3-letter ISO 4217 format. Required when `value` or `price` is set.
   */
  currency?: string
  /**
   * Additional fields for this event. This field may be useful for Algolia Insights fields which are not mapped in Segment.
   */
  extraProperties?: {
    [k: string]: unknown
  }
  /**
   * The name of the event to send to Algolia. Defaults to 'Conversion Event'
   */
  eventName?: string
  /**
   * The type of event to send to Algolia. Defaults to 'conversion'
   */
  eventType?: string
}
