// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier of the customer profile associated to the event.
   */
  customer_profile_id: string
  /**
   * It's just the name of your event.
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
