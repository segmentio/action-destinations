// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who viewed a portion of the item.
   */
  userId: string
  /**
   * The ID of the item that was viewed.
   */
  itemId: string
  /**
   * The UTC timestamp of when the view portion occurred, in Unix seconds, Unix milliseconds, or ISO-8601 format. When recording interactions you plan to later delete by exact timestamp — whether via this destination or the Recombee API directly — avoid mapping the root `timestamp` here, as it may be corrected for clock skew. Use `properties.timestamp` instead.
   */
  timestamp?: string | number
  /**
   * The portion of the item that the user viewed.
   */
  portion: {
    /**
     * The total length of the item that the user can view (for example, in seconds or minutes).
     */
    totalLength: number
    /**
     * The user's watched time of the item (measured in the same units as Total Length).
     */
    watchTime: number
  }
  /**
   * The ID of the session in which the user viewed the item.
   */
  sessionId?: string
  /**
   * The ID of the clicked recommendation (if the view portion is based on a recommendation request).
   */
  recommId?: string
  /**
   * Internal additional data to be stored with the view portion.
   */
  internalAdditionalData?: {
    [k: string]: unknown
  }
  /**
   * Additional data to be stored with the view portion. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
