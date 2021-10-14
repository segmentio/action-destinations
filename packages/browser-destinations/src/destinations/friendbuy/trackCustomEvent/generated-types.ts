// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to track.
   */
  eventName: string
  /**
   * Hash of other properties for the event being tracked. All of the fields in this object will be sent in the root of the Friendbuy track event.
   */
  eventProperties: {
    [k: string]: unknown
  }
  /**
   * An identifier for the event being tracked to prevent the same event from being rewarded more than once.
   */
  deduplicationId?: string
}
