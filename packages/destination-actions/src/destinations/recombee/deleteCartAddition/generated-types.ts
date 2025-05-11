// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who added the item to the cart.
   */
  userId: string
  /**
   * The item that was added to the cart.
   */
  itemId: string
  /**
   * The UTC timestamp of when the cart addition occurred. If the timestamp is omitted, then all the cart additions with the given `userId` and `itemId` are deleted.
   */
  timestamp?: string
}
