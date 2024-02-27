// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Directory id. Also known as the Pool ID. POOL_XXX
   */
  directoryId: string
  /**
   * The external data reference which is a unique identifier for the user
   */
  extRef?: string
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
}
