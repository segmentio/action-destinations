// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The id of the integration
   */
  integrationId: string
  /**
   * The id of the event configuration
   */
  eventConfigurationId: string
  /**
   * A JSON object that will be passed to the Engagement Cloud
   */
  event_payload?: {
    [k: string]: unknown
  } | null
}
