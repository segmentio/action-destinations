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
   * Only respected in email-based projects. Whether or not a new user should be created if the request includes a userId that doesn't yet exist in the Iterable project.
   */
  preferUserId?: boolean
  /**
   * If you'd like to merge (rather than overwrite) a user profile's top-level objects with the values provided for them in the request body, set mergeNestedObjects to true.
   */
  mergeNestedObjects?: boolean
}
