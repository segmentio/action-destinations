// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the message. Used for cache busting.
   */
  id: string
  /**
   * The namespace of the Mobile App.
   */
  appId: string
  /**
   * The name of the event to send to Epsilon.
   */
  dtm_event: string
  /**
   * The version of the Mobile App.
   */
  version: string
  /**
   * Form ID used in Epsilon’s system to identify app visits vs. conversions.
   */
  dtm_fid: string
  /**
   * Promo ID used in Epsilon’s system to identify the promotion associated with the event.
   */
  dtm_promo_id?: string
  /**
   * Unique identifiers for the user.
   */
  identifiers: {
    /**
     * Mobile Device ID (IDFV or Google App Set ID).
     */
    deviceID?: string
    /**
     * Mobile Ad ID (IDFA or Google Add ID).
     */
    advertisingId?: string
    /**
     * User agent of the mobile device.
     */
    dtm_user_agent?: string
    /**
     * IP address of the user.
     */
    dtm_user_ip?: string
    /**
     * Accepts hashed or unhashed emails. Segment will ensure that a non hashed email is hashed before being sent to Epsilon
     */
    dtm_email_hash?: string
    /**
     * Accepts hashed or unhashed mobile numbers. Segment will ensure that a non hashed mobile number is hashed before being sent to Epsilon
     */
    dtm_mobile_hash?: string
    /**
     * Unique identifier for the user.
     */
    dtm_user_id?: string
  }
  /**
   * Type of the device (e.g., iOS, Android).
   */
  deviceType: string
}
