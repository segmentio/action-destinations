// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Select the field to identify contacts
   */
  channelIdentifier: string
  /**
   * The contact's email address.
   */
  emailIdentifier?: string
  /**
   * The contact's mobile number.
   */
  mobileNumberIdentifier?: string
  /**
   * The list to remove the contact from.
   */
  listId: number
  /**
   * An object containing key/value pairs for any data fields assigned to this contact, custom data fields needs to exists in Dotdigital.
   */
  dataFields?: {
    [k: string]: unknown
  }
}
