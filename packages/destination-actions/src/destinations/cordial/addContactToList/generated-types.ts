// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Mapping to identify contact on Cordial side. Should be provided in form of cordialKey (path to the primary or secondary Cordial Contact key using dot notation) -> segmentValue. For example: channels.email.address -> userId or icfs.segmentId -> userId
   */
  userIdentities: {
    [k: string]: unknown
  }
  /**
   * Segment Group ID
   */
  groupId: string
  /**
   * Cordial List Name
   */
  listName?: string
}
