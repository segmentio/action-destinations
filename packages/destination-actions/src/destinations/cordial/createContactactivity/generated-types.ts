// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Mapping to identify contact on Cordial side. Should be provided in form of cordialKey (path to the primary or secondary Cordial Contact key using dot notation) -> segmentValue. For example: channels.email.address -> userId or icfs.segmentId -> userId
   */
  userIdentities: {
    [k: string]: unknown
  }
  /**
   * Segment event name
   */
  action: string
  /**
   * Segment event sentAt
   */
  time?: string | number
  /**
   * Segment event properties
   */
  properties?: {
    [k: string]: unknown
  }
}
