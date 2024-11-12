// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Yahoo taxonomy
   */
  segment_audience_id: string
  /**
   * Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy
   */
  segment_audience_key: string
  /**
   * Event traits or properties. Do not modify this setting
   */
  event_attributes: {
    [k: string]: unknown
  }
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * Phone number of a user
   */
  phone?: string
  /**
   * Email address of a user
   */
  email?: string
  /**
   * User's mobile advertising Id
   */
  advertising_id?: string
  /**
   * User's mobile device type
   */
  device_type?: string
  /**
   * GDPR Settings for the audience
   */
  gdpr_settings?: {
    /**
     * Set to true to indicate that audience data is subject to GDPR regulations
     */
    gdpr_flag: boolean
    /**
     * Required if GDPR flag is set to "true". Using IAB Purpose bit descriptions specify the following user consent attributes: "Storage and Access of Information", "Personalization"
     */
    gdpr_euconsent?: string
  }
  /**
   * If true, batch requests to Yahoo. Yahoo accepts batches of up to 1000 events. If false, send each event individually.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
