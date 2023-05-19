// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An email address that identifies a user profile in Iterable.
   */
  email?: string
  /**
   * A user ID that identifies a user profile in Iterable.
   */
  userId?: string
  /**
   * Data to store on the user profile.
   */
  dataFields?: {
    [k: string]: unknown
  }
  /**
   * User phone number. Must be a valid phone number including country code. e.g. +14158675309
   */
  phoneNumber?: string
  /**
   * If you'd like to merge (rather than overwrite) a user profile's top-level objects with the values provided for them in the request body, set mergeNestedObjects to true.
   */
  mergeNestedObjects?: boolean
}
