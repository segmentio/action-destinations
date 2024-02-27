// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Hash of properties for this purchase. Keys are limited to 255 characters in length, cannot begin with a $, and can only contain alphanumeric characters and punctuation. Values can be numeric, boolean, Date objects, strings 255 characters or shorter, or nested objects whose values can be numeric, boolean, Date objects, arrays, strings, or null. Total size of purchase properties cannot exceed 50KB.
   */
  purchaseProperties?: {
    [k: string]: unknown
  }
  /**
   * List of products purchased by the user
   */
  products?: {
    /**
     * A string identifier for the product purchased, e.g. an SKU. Value is limited to 255 characters in length, cannot begin with a $, and can only contain alphanumeric characters and punctuation.
     */
    product_id: string
    /**
     * The price paid. Base units depend on the currency. As an example, USD should be reported as Dollars.Cents, whereas JPY should be reported as a whole number of Yen. All provided values will be rounded to two digits with toFixed(2)
     */
    price: number
    /**
     * Default USD. Currencies should be represented as an ISO 4217 currency code
     */
    currency?: string
    /**
     * Default 1. The quantity of items purchased expressed as a whole number. Must be at least 1 and at most 100.
     */
    quantity?: number
  }[]
}
