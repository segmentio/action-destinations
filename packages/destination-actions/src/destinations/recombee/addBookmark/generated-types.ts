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
   * The UTC timestamp of when the bookmark occurred, in Unix seconds or ISO-8601 format. Set `properties.timestamp` in your event to use a stable anchor for later exact-match deletion. Falls back to Segment's root timestamp if omitted.
   */
  timestamp?: string | number
  /**
   * The ID of the clicked recommendation (if the bookmark is based on a recommendation request).
   */
  recommId?: string
  /**
   * Internal additional data to be stored with the bookmark.
   */
  internalAdditionalData?: {
    [k: string]: unknown
  }
  /**
   * Additional data to be stored with the bookmark. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
