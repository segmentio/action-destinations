// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the action being performed.
   */
  event: string
  /**
   * A distinct ID randomly generated prior to calling identify.
   */
  anonymousId?: string
  /**
   * The distinct ID after calling identify.
   */
  userId?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  groupId?: string
  /**
   * A random id that is unique to an event. Launchpad uses $insert_id to deduplicate events.
   */
  messageId?: string
  /**
   * The timestamp of the event. Launchpad expects epoch timestamp in millisecond or second. Please note, Launchpad only accepts this field as the timestamp. If the field is empty, it will be set to the time Launchpad servers receive it.
   */
  timestamp?: string | number
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that represent additional data tied to the user.
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
