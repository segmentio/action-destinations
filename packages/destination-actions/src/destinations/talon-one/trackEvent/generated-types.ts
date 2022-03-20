// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier of the customer profile associated to the event.
   */
  customerProfileId: string
  /**
   * It is just the name of your event.
   */
  eventType: string
  /**
   * Type of event. Can be only `string`, `time`, `number`, `boolean`, `location`
   */
  type: string
  /**
   * Arbitrary additional JSON data associated with the event.
   */
  attributes?: {
    [k: string]: unknown
  }
}
