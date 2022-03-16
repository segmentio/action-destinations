// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier of the customer profile.
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
   * List the AVPs you need to update in the customer profile.
   */
  attributes?: {
    [k: string]: unknown
  }
}
