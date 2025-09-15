// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who bookmarked the item.
   */
  userId: string
  /**
   * The item that was bookmarked.
   */
  itemId: string
  /**
   * The UTC timestamp of when the bookmark occurred. If the timestamp is omitted, then all the bookmarks with the given `userId` and `itemId` are deleted.
   */
  timestamp?: string
}
