// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of custom audience list to which emails should added/removed
   */
  custom_audience_name: string
  /**
   * Segment computation class used to determine if action is an 'Engage-Audience'
   */
  segment_computation_action: string
  /**
   * User's email address for including/excluding from custom audience
   */
  email: string
  /**
   * User's phone number for including/excluding from custom audience
   */
  phone?: string
  /**
   * Object which will be computed differently for track and identify events
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Known user identifier for the user
   */
  user_id?: string
  /**
   * Anonymous user identifier for the user
   */
  anonymous_id?: string
  /**
   * Type of event
   */
  event_type: string
  /**
   * Name of event
   */
  event_name?: string
  /**
   * Timestamp of event
   */
  timestamp: string
}
