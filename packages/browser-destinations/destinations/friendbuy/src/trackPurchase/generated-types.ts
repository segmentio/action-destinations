// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The order ID.
   */
  orderId: string
  /**
   * Purchase amount to be considered when evaluating reward rules.
   */
  amount: number
  /**
   * The currency of the purchase amount.
   */
  currency: string
  /**
   * The coupon code of any coupon redeemed with the order.
   */
  coupon?: string
  /**
   * Friendbuy attribution ID that associates the purchase with the advocate who referred the purchaser.
   */
  attributionId?: string
  /**
   * Friendbuy referral code that associates the purchase with the advocate who referred the purchaser.
   */
  referralCode?: string
  /**
   * An array of gift card codes applied to the order.
   */
  giftCardCodes?: string[]
  /**
   * Products purchased.
   */
  products?: {
    sku?: string
    name?: string
    quantity?: number
    price: number
    description?: string
    category?: string
    url?: string
    image_url?: string
  }[]
  /**
   * The user's customer ID.
   */
  customerId?: string
  /**
   * The user's anonymous ID.
   */
  anonymousId?: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * Flag to indicate whether the user is a new customer.
   */
  isNewCustomer?: boolean
  /**
   * The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".
   */
  loyaltyStatus?: string
  /**
   * The user's given name.
   */
  firstName?: string
  /**
   * The user's surname.
   */
  lastName?: string
  /**
   * The user's full name.
   */
  name?: string
  /**
   * The user's age.
   */
  age?: number
  /**
   * The user's birthday in the format "YYYY-MM-DD", or "0000-MM-DD" to omit the year.
   */
  birthday?: string
  /**
   * Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.
   */
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}
