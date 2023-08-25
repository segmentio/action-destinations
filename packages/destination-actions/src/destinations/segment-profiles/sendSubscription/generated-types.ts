// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Profile Space to use for creating a record. *Note: This field shows list of internal sources associated with the Profile Space. Changes made to the Profile Space name in **Settings** will not reflect in this list unless the source associated with the Profile Space is renamed explicitly.*
   */
  engage_space: string
  /**
   * Unique identifier for the user in your database. A userId or an anonymousId is required.
   */
  user_id?: string
  /**
   * A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.
   */
  anonymous_id?: string
  /**
   * Free-form dictionary of traits that describe the user or group of users.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Information about users Global Subscription, Channel, Subscription Groups.
   */
  subscriptions?: {
    /**
     * The unique identifier for the subscription (e.g., phone number, email).
     */
    key: string
    /**
     * The medium of subscription (e.g., SMS, EMAIL, WHATSAPP).
     */
    type: string
    /**
     * The subscription status for the user.
     */
    status: string
    /**
     * Subscription groups the user is associated with.
     */
    groups?: {
      /**
       * Name of the subscription group.
       */
      name: string
      /**
       * The subscription status for the specific group.
       */
      status: string
    }[]
  }[]
}
