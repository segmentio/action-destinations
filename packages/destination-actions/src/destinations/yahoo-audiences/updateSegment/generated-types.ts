// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience Id
   */
  segment_audience_id: string
  /**
   * Segment Audience Key
   */
  segment_audience_key: string
  /**
   * The user's email address to send to LinkedIn.
   */
  email?: string
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * Enable batching of requests to the LinkedIn DMP Segment.
   */
  enable_batching?: boolean & string
  /**
   * The user's Mobile Advertising ID
   */
  advertising_id?: string
  /**
   * The user's mobile device type
   */
  device_type?: string
  /**
   * Send mobile advertising ID (IDFA, AAID or GAID) to Yahoo. Segment will hash MAIDs
   */
  send_advertising_id?: boolean
  /**
   * Send user email to Yahoo. Segment will hash emails
   */
  send_email?: boolean
  /**
   * Set to true to indicate that audience data is subject to GDPR regulations
   */
  gdpr_flag?: boolean
  /**
   * Required if GDPR flag is set to "true". Using IAB Purpose bit descriptions specify the following user consent attributes: "Storage and Access of Information", "Personalization"
   */
  gdpr_euconsent?: string
}
