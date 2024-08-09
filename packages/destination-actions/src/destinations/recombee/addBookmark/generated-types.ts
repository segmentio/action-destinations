// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who bookmarked the item.
   */
  userId: string
  /**
   * The bookmarked item.
   */
  itemId: string
  /**
   * The UTC timestamp of when the bookmark event occurred.
   */
  timestamp?: string
  /**
   * The ID of the clicked recommendation (if the bookmark is based on a recommendation request).
   */
  recommId?: string
  /**
   * Additional data to be stored with the bookmark. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
