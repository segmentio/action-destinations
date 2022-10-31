// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId: string
  /**
   * The user hash used for identity verification. See [Intercom docs](https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile) for more information on how to set this field.
   */
  hmac?: string
  /**
   * The Segment traits to be forwarded to CommandBar
   */
  traits?: {
    [k: string]: unknown
  }
}
