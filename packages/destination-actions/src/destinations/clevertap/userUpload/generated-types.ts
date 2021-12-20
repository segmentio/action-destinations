// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.
   */
  ts?: string
  /**
   * Profile Data
   */
  profileData?: {
    [k: string]: unknown
  }
  /**
   * Identity
   */
  identity: string
}
