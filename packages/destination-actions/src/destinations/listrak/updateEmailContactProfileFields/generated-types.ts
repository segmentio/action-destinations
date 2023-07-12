// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to locate the list. Find this under Help & Support > API ID Information in https://admin.listrak.com.
   */
  listId: number
  /**
   * Email address of the contact.
   */
  emailAddress: string
  /**
   * Add key value pairs to set one or more profile fields. The key is the profile field ID you want to set. Find this under Help & Support > API ID Information in https://admin.listrak.com. The value is the profile field value. (i.e. 1234 = on)
   */
  profileFieldValues: {
    [k: string]: unknown
  }
  /**
   * When enabled, multiple events will be sent to Listrak in a single request, which is recommended for optimal performance.
   */
  enable_batching: boolean
}
