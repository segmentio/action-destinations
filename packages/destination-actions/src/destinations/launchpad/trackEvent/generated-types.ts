// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the action being performed.
   */
  event: string
  /**
   * A unique ID for a known user. This will be used as the Distinct ID. This field is required if the Anonymous ID field is empty
   */
  userId?: string
  /**
   * A unique ID for an anonymous user. This will be used as the Distinct ID if the User ID field is empty. This field is required if the User ID field is empty
   */
  anonymousId?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  groupId?: string
  /**
   * A random id that is unique to an event. Launchpad uses $insert_id to deduplicate events.
   */
  messageId: string
  /**
   * The timestamp of the event. Launchpad expects epoch timestamp in millisecond or second. Please note, Launchpad only accepts this field as the timestamp. If the field is empty, it will be set to the time Launchpad servers receive it.
   */
  timestamp: string | number
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that represent additional data tied to the user. This is used for segmentation within the platform.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that provides useful context about the event.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Set as true to ensure Segment sends data to Launchpad in batches.
   */
  enable_batching?: boolean
}
