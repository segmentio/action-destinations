// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Select the field to identify contacts.
   */
  channelIdentifier: string
  /**
   * The Contact's email address.
   */
  emailIdentifier?: string
  /**
   * The Contact's mobile number.
   */
  mobileNumberIdentifier?: string
  /**
   * The list to add the contact to.
   */
  listId: number
  /**
   * An object containing key/value pairs for data fields assigned to this Contact. Custom Data Fields must already be defined in Dotdigital.
   */
  dataFields?: {
    [k: string]: unknown
  }
}
