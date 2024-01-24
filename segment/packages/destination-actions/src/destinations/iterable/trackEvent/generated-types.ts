// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An email address that identifies a user profile in Iterable.
   */
  email?: string
  /**
   * A user ID that identifies a user profile in Iterable.
   */
  userId?: string
  /**
   * Name of the event
   */
  eventName: string
  /**
   * Additional event properties.
   */
  dataFields?: {
    [k: string]: unknown
  }
  /**
   * A unique ID. If an event exists with that id, the event will be updated
   */
  id?: string
  /**
   * Time the event took place.
   */
  createdAt?: string | number
  /**
   * Iterable campaign the event can be attributed to.
   */
  campaignId?: number
  /**
   * Iterable template the event can be attributed to.
   */
  templateId?: number
}
