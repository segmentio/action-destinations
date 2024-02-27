// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user to send properties for. Required if anonymousId is not provided
   */
  userId?: string
  /**
   * The anonymous ID of the user to send properties for. Required if userId is not provided
   */
  anonymousId?: string
  /**
   * Toplyne calculates the creation time of the user using the timestamp of the first track or identify call
   */
  creationTime: string | number
  /**
   * The properties of the user
   */
  userProperties?: {
    [k: string]: unknown
  }
}
