// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of the customer profile as used in Talon.One
   */
  customer_profile_id: string
  /**
   * Name of the custom attribute of type `event`
   */
  event_type: string
  /**
   * Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`
   */
  type: string
  /**
   * Arbitrary additional JSON data associated with the event
   */
  event_attributes?: {
    [k: string]: unknown
  }
}
