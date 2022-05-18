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
   * The id of the contact to add the transaction. if this field is not supplied, you must supply an extRef, email and/or phone so a look can be performed
   */
  contactId?: string
  /**
   * The external data reference which is a unique identifier for the user
   */
  extRef?: string | null
  /**
   * Email of contact
   */
  email?: string | null
  /**
   * Phone number of contact
   */
  phone?: string | null
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
