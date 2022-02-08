// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.
   */
  userId?: string
  /**
   * Anonymous identifier for the user
   */
  anonymousId: string
  /**
   * Profile parameters specific to a user.
   */
  traits: {
    [k: string]: unknown
  }
}
