// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who viewed the item.
   */
  userId: string
  /**
   * The viewed item.
   */
  itemId: string
  /**
   * The UTC timestamp of when the view occurred.
   */
  timestamp?: string
  /**
   * The duration of the view in seconds.
   */
  duration?: number
  /**
   * The ID of the clicked recommendation (if the view is based on a recommendation request).
   */
  recommId?: string
  /**
   * Additional data to be stored with the view. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
