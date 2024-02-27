// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the account to send properties for
   */
  accountId: string
  /**
   * Toplyne calculates the creation time using the timestamp of the first event or group call
   */
  creationTime: string | number
  /**
   * The properties of the account
   */
  accountProperties?: {
    [k: string]: unknown
  }
}
