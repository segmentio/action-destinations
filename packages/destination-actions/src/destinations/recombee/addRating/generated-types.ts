// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who submitted the rating.
   */
  userId: string
  /**
   * The ID of the item that was rated.
   */
  itemId: string
  /**
   * The UTC timestamp of when the rating occurred, in Unix seconds, Unix milliseconds, or ISO-8601 format. When recording interactions you plan to later delete by exact timestamp — whether via this destination or the Recombee API directly — avoid mapping the root `timestamp` here, as it may be corrected for clock skew. Use `properties.timestamp` instead.
   */
  timestamp?: string | number
  /**
   * The rating of the item rescaled to interval [-1.0,1.0], where -1.0 means the worst rating possible, 0.0 means neutral, and 1.0 means absolutely positive rating. For example, in the case of 5-star evaluations, rating = (numStars-3)/2 formula may be used for the conversion.
   */
  rating: number
  /**
   * The ID of the clicked recommendation (if the rating is based on a recommendation request).
   */
  recommId?: string
  /**
   * Internal additional data to be stored with the rating.
   */
  internalAdditionalData?: {
    [k: string]: unknown
  }
  /**
   * Additional data to be stored with the rating. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
