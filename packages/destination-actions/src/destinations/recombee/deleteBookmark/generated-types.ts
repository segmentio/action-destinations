// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who bookmarked the item.
   */
  userId: string
  /**
   * The ID of the item that was bookmarked.
   */
  itemId: string
  /**
   * The UTC timestamp of the bookmark to delete, in Unix seconds or ISO-8601 format. Must match the value used when the bookmark was created. If omitted, all bookmarks for the given `userId` and `itemId` are deleted.
   */
  timestamp?: string | number
}
