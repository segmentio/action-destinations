// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event
   */
  name: string
  /**
   * The event metadata to send to Gameball
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Unique identifier for the player in your database.
   */
  playerUniqueId: string
  /**
   * Player's unique mobile number.
   */
  mobile?: string
  /**
   * Player's unique email.
   */
  email?: string
}
