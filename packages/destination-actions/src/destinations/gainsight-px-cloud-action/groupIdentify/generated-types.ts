// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the account.
   */
  groupId: string
  /**
   * Properties to set on the user profile
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The generated anonymous ID for the user
   */
  anonymousId?: string | null
  /**
   * Segment context with ip and userAgent
   */
  context: {
    /**
     * UTM Tracking Properties
     */
    campaign?: {
      source?: string
      medium?: string
      name?: string
      term?: string
      content?: string
    }
    /**
     * information about the user’s current location
     */
    location?: {
      city?: string
      country?: string
      latitude?: number
      longitude?: number
      region?: string
      speed?: number
    }
    /**
     * Current page properties
     */
    page?: {
      path?: string
      referrer?: string
      search?: string
      title?: string
      url?: string
    }
    /**
     * Screen Properties
     */
    screen?: {
      width?: number
      height?: number
    }
    /**
     * Application Properties
     */
    app?: {
      name?: string
      version?: string
      build?: string
    }
    /**
     * Device Properties
     */
    device?: {
      [k: string]: unknown
    }
    /**
     * Network Properties
     */
    network?: {
      [k: string]: unknown
    }
    /**
     * Device Properties
     */
    library?: {
      name?: string
      version?: string
    }
    /**
     * Users IP address
     */
    ip?: string
    /**
     * Users Locale string
     */
    locale?: string
    /**
     * User Agent string
     */
    userAgent?: string
  }
  /**
   * The message ID uniquely identifies an event to ensure each event is only processed once.
   */
  messageId: string
  /**
   * The timestamp at which this event was received.
   */
  receivedAt: string | number
  /**
   * The timestamp at which this was sent.
   */
  sentAt: string | number
  /**
   * The timestamp at which this event occurred.
   */
  timestamp: string | number
  /**
   * The unique user identifier
   */
  userId: string | null
  /**
   * Segment event type
   */
  type: string
  /**
   * Version of the Segment Tracking API that received the message
   */
  version?: number | null
}
