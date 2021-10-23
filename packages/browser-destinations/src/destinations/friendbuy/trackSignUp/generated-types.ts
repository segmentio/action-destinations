// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's customerId.
   */
  customerId: string
  /**
   * The user's anonymous id
   */
  anonymousId?: string
  /**
   * The user's email address.
   */
  email: string
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
   * The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".
   */
  loyaltyStatus?: string
  /**
   * Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.
   */
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}
