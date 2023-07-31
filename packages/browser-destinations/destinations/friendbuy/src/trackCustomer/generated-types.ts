// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's customer ID.
   */
  customerId: string
  /**
   * The user's anonymous id.
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
   * The user's birthday in the format "YYYY-MM-DD", or "0000-MM-DD" to omit the year.
   */
  birthday?: string
  /**
   * The user's language.
   */
  language?: string
  /**
   * The user's country.
   */
  addressCountry?: string
  /**
   * The user's state.
   */
  addressState?: string
  /**
   * The user's city.
   */
  addressCity?: string
  /**
   * The user's postal code.
   */
  addressPostalCode?: string
  /**
   * The date the user became a customer.
   */
  customerSince?: string
  /**
   * The status of the user in your loyalty program. Valid values are "in", "out", or "blocked".
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
