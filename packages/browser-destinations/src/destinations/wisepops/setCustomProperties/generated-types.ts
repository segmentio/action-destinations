// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's custom properties to send to Wisepops.
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * A unique identifier for the user.
   */
  userId?: string
  /**
   * By default, custom properties persist across pages. Enable temporary properties to limit them to the current page only.
   */
  temporary?: boolean
}
