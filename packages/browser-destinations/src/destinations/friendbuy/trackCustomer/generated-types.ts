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
   * The user's full name. If the name trait doesn't exist then it will be automatically derived from the firstName and lastName traits if they are defined.
   */
  name?: string
  /**
   * The user's age.
   */
  age?: number
  /**
   * The date the user became a customer
   */
  customerSince?: string
  /**
   * The user's loyalty program status. Valid values are "in", "out", or "blocked".
   */
  loyaltyStatus?: string
  /**
   * Flag to indicate whether the user is a new customer.
   */
  isNewCustomer?: boolean
  /**
   * Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.
   */
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}
