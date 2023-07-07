// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to locate the list.
   */
  listId: number
  /**
   * Email address of the contact.
   */
  emailAddress: string
  /**
   * Add key value pairs to set one or more profile fields. The key is the profile field ID you want to set. The value is the profile field value.
   */
  profileFieldValues: {
    [k: string]: unknown
  }
}
