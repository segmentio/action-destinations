// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Directory id. Also known as the Pool ID. POOL_XXX
   */
  directoryId: string
  /**
   * ID of the mailing list the contact belongs too
   */
  mailingListId: string
  /**
   * The id of the contact to add the transaction. if this field is not supplied, you must supply an extRef, email and/or phone so a look can be performed. If the lookup does not find a contact, one will be created with these fields and including the optionally supplied firstName, lastName, language, subscribed and embeddedData
   */
  contactId?: string
  /**
   * The external data reference which is a unique identifier for the user
   */
  extRef: string
  /**
   * Email of contact
   */
  email?: string
  /**
   * Phone number of contact
   */
  phone?: string
  /**
   * First name of contact
   */
  firstName?: string
  /**
   * Last name of contact
   */
  lastName?: string
  /**
   * Language code of the contact
   */
  language?: string
  /**
   * Should the contact be unsubscribed from correspondence
   */
  unsubscribed?: boolean
  /**
   * Contact embedded data (properties of the contact)
   */
  embeddedData?: {
    [k: string]: unknown
  }
  /**
   * Date and time of when the transaction occurred.
   */
  transactionDate?: string | number
  /**
   * Properties of the transaction too add to the users record
   */
  transactionData?: {
    [k: string]: unknown
  }
}
