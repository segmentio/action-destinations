// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User Profile traits to send to Contentstack, for Identify calls
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User Profile properties to send to Contentstack, for Track calls
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Type of the event
   */
  type: string
  /**
   * ID for the user
   */
  userId: string
}
