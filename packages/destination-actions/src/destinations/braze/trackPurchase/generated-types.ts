// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * The unique user identifier
   */
  braze_id?: string | null
  /**
   * When the event occurred.
   */
  time: string | number
  /**
   * Products purchased
   */
  products: {
    product_id: string
    currency?: string
    price: number
    quantity?: number
  }[]
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Setting this flag to true will put the API in "Update Only" mode. When using a "user_alias", "Update Only" mode is always true.
   */
  _update_existing_only?: boolean
}
