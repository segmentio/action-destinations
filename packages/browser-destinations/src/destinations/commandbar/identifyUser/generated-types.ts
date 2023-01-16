// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId: string
  /**
   * Identify users with an HMAC of their user ID; this enables end user customizable shortcuts and other features. [Learn about identity verification](https://app.commandbar.com/identity-verification).
   */
  hmac?: string
  /**
   * Configures the way the bar is displayed. An 'inline' bar is always visible and hosted within an element on your page. A 'modal' bar will display in a modal dialog when open.
   */
  formFactor?: {
    [k: string]: unknown
  }
  /**
   * The Segment traits to be forwarded to CommandBar
   */
  traits?: {
    [k: string]: unknown
  }
}
