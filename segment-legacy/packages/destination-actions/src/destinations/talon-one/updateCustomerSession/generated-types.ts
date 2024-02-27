// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer session integration identifier to use in Talon.One.
   */
  customerSessionId: string
  /**
   * This specifies the address of the service and its endpoint to do callback request.
   */
  callbackDestination?: string
  /**
   * This specifies API key and relative header. The header is specified optionally
   */
  callbackAPIKey?: string
  /**
   * This specifies a list of the fields from the response you need to receive. Comma character is separator. If omitted, all the fields will be forwarded from the response to the callback destination.
   */
  contentFields?: string
  /**
   * This specifies ID of the request that will be forwarded to the destination URI with the callback request with the same header name. If omitted, the X-Correlation-ID will not be in the callback request.
   */
  callbackCorrelationId?: string
  /**
   * This contains all the data related to customer session.
   */
  customerSession: {
    /**
     * The customer profile integration identifier to use in Talon.One.
     */
    profileId?: string
    /**
     * Any coupon codes entered. Up to 100 coupons.`
     */
    couponCodes?: string[]
    /**
     * Any referral code entered.`
     */
    referralCode?: string
    /**
     * Any loyalty cards used. Up to 1 loyalty cards.`
     */
    loyaltyCards?: string[]
    /**
     * Indicates the current state of the session. `
     */
    state?: string
    /**
     * The items to add to this sessions.
     *
     * If cart item flattening is disabled: Do not exceed 1000 items (regardless of their quantity) per request.
     * If cart item flattening is enabled: Do not exceed 1000 items and ensure the sum of all cart item's quantity does not exceed 10.000 per request.`
     */
    cartItems?: {
      /**
       * Name of item
       */
      name?: string
      /**
       * Stock keeping unit of item.
       */
      sku?: string
      /**
       * Quantity of item. Important: If you enabled cart item flattening, the quantity is always one and the same cart item might receive multiple per-item discounts. Ensure you can process multiple discounts on one cart item correctly.
       */
      quantity?: number
      /**
       * Price of item.
       */
      price?: number
      /**
       * Number of returned items, calculated internally based on returns of this item.
       */
      returnedQuantity?: string
      /**
       * Remaining quantity of the item, calculated internally based on returns of this item.
       */
      remainingQuantity?: string
      /**
       * Type, group or model of the item.
       */
      category?: string
      /**
       * Weight of item in grams.
       */
      weight?: string
      /**
       * Height of item in mm.
       */
      height?: string
      /**
       * Length of item in mm.
       */
      length?: string
      /**
       * Position of the Cart Item in the Cart (calculated internally).
       */
      position?: string
      /**
       * Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to this cart item.
       *
       * Custom cart item attributes must be created in the Campaign Manager before you set them with this property.
       *
       * [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
       */
      attributes?: {
        [k: string]: unknown
      }
      /**
       * Use this property to set a value for the additional costs of this session, such as a shipping cost.`
       */
      additionalCosts?: {
        [k: string]: unknown
      }
    }[]
    /**
     * Use this property to set a value for the additional costs of this session, such as a shipping cost.`
     */
    additionalCosts?: {
      [k: string]: unknown
    }
    /**
     * Use this property to set a value for the attributes of your choice. Attributes represent any information to attach to your session, like the shipping city. [See more info](https://docs.talon.one/docs/product/account/dev-tools/managing-attributes).
     */
    attributes?: {
      [k: string]: unknown
    }
  }
  /**
   * Use this field if you want to identify a session attribute with a specific type
   */
  sessionAttributesInfo?: {
    /**
     * Attribute name
     */
    name: string
    /**
     * Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`
     */
    type: string
  }[]
  /**
   * Use this field if you want to identify a cart item attribute with a specific type
   */
  cartItemsAttributesInfo?: {
    /**
     * Attribute name
     */
    name: string
    /**
     * Attribute type. Can be only `string`, `time`, `number`, `boolean`, `location`
     */
    type: string
  }[]
}
