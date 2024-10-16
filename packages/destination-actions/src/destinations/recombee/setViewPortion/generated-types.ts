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
   * The viewed portion of the item as a number in the interval [0.0,1.0], where 0.0 means the user viewed nothing and 1.0 means the full item was viewed. It should be the actual viewed part of the item, no matter the seeking. For example, if the user seeked immediately to half of the item and then viewed 10% of the item, the `portion` should still be `0.1`.
   */
  portion: number
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
