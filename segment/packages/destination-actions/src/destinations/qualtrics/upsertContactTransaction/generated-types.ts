// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Directory id. Also known as the Pool ID. POOL_XXX
   */
  directoryId: string
  /**
   * ID of the mailing list the contact belongs too. If not part of the event payload, create / use an existing mailing list from Qualtrics. Will have the form CG_xxx
   */
  mailingListId: string
  /**
   * The id of the contact to add the transaction. if this field is not supplied, you must supply an external data reference, email and/or phone so a look can be performed. If the lookup does not find a contact, one will be created with these fields and including the optionally supplied firstName, lastName, language, subscribed and embeddedData
   */
  contactId?: string
  /**
   * The external data reference which is a unique identifier for the user. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.
   */
  extRef: string
  /**
   * Email of contact. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.
   */
  email?: string
  /**
   * Phone number of contact. This is only used to search for the contact and if a new contact needs to be created, it is not added to the transaction data.
   */
  phone?: string
  /**
   * First name of contact. This is only used if a new contact needs to be created and is not added to the transaction data.
   */
  firstName?: string
  /**
   * Last name of contact. This is only used if a new contact needs to be created and is not added to the transaction data.
   */
  lastName?: string
  /**
   * Language code of the contact. This is only used if a new contact needs to be created and is not added to the transaction data.
   */
  language?: string
  /**
   * Should the contact be unsubscribed from correspondence. This is only used if a new contact needs to be created and is not added to the transaction.
   */
  unsubscribed?: boolean
  /**
   * Contact embedded data (properties of the contact). These are added to the contact only if a new contact needs to be created not added to the transaction.
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
