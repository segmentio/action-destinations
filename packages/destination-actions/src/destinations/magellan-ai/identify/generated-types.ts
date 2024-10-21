// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Your internal, unique identifier for the user
   */
  userId: string
  /**
   * The IPv4 address of the end user (Note: Segment does not support collecting IPv6 addresses)
   */
  ip: string
  /**
   * The user agent of the end user (Note: not collected by the iOS Segment agent)
   */
  ua: string
}
