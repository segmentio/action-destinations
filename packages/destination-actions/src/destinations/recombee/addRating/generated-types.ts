// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who submitted the rating.
   */
  userId: string
  /**
   * The rated item.
   */
  itemId: string
  /**
   * The UTC timestamp of when the rating occurred.
   */
  timestamp?: string
  /**
   * The rating of the item rescaled to interval [-1.0,1.0], where -1.0 means the worst rating possible, 0.0 means neutral, and 1.0 means absolutely positive rating. For example, in the case of 5-star evaluations, rating = (numStars-3)/2 formula may be used for the conversion.
   */
  rating: number
  /**
   * The ID of the clicked recommendation (if the rating is based on a recommendation request).
   */
  recommId?: string
  /**
   * Additional data to be stored with the rating. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
