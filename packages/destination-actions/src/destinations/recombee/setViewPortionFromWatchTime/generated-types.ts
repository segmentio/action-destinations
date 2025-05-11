// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who viewed a portion of the item.
   */
  userId: string
  /**
   * The viewed item.
   */
  itemId: string
  /**
   * The UTC timestamp of when the view portion occurred.
   */
  timestamp?: string
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
   * Additional data to be stored with the view portion. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
