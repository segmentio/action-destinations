// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the user in Vero. Required if no Email is provided.
   */
  userId?: string
  /**
   * The email address of the user. Required if no User ID is provided.
   */
  email?: string
  /**
   * Properties to set on the user. Computed traits can be mapped here. All values are sent to Vero as strings.
   */
  userProperties?: {
    [k: string]: unknown
  }
  /**
   * The timezone of the user, as a UTC offset in hours.
   */
  timezone?: number
  /**
   * The language of the user.
   */
  language?: string
  /**
   * The user agent of the user.
   */
  userAgent?: string
  /**
   * Push notification devices to register for the user.
   */
  pushDevices?: {
    /**
     * The push token of the device.
     */
    token: string
    /**
     * The platform of the device.
     */
    platform: string
  }[]
  /**
   * When the user was created. Sent to Vero as an ISO 8601 string.
   */
  createdAt?: string | number
  /**
   * If enabled, Vero will only update existing users and will not create new ones.
   */
  updateOnly?: boolean
  /**
   * Subscription topic preferences for the user. Provide a topic ID or a topic name, and a status.
   */
  topicPreferences?: {
    /**
     * The ID of the topic in Vero.
     */
    id?: number
    /**
     * The name of the topic in Vero. Provide either a Topic ID or a Topic Name, not both.
     */
    name?: string
    /**
     * The subscription status for the topic.
     */
    status: string
  }[]
}
