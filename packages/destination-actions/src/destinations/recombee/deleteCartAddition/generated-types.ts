// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who added the item to the cart.
   */
  userId: string
  /**
   * The ID of the item that was added to the cart.
   */
  itemId: string
  /**
   * The UTC timestamp of the cart addition to delete, in Unix seconds, Unix milliseconds, or ISO-8601 format. Must match the timestamp used in the cart addition to be deleted. If omitted, all cart additions for the given `userId` and `itemId` are deleted.
   */
  timestamp?: string | number
}
