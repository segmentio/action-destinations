// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of Encharge object to create or update.
   */
  objectType: string
  /**
   * An ID from your app/database that is used to uniquely identify the object in Encharge.
   */
  externalId?: string
  /**
   * The Encharge ID of the object. Usually, you want to omit this and use External ID.
   */
  id?: string
  /**
   * Data for the Object fields to associate with the user in Encharge. Any unexisting fields will be ignored.
   */
  objectData?: {
    [k: string]: unknown
  }
  /**
   * The User ID of the user to associate with the object. If no email or user ID is provided, no user will be created and associated.
   */
  userId?: string
  /**
   * The email of the user to associate with the object. If no email or user ID is provided, no user will be created and associated.
   */
  email?: string
}
