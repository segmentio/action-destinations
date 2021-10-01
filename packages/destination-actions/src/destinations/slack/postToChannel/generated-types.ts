// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Slack webhook URL.
   */
  url: string
  /**
   * The text message to post to Slack. You can use [Slack's formatting syntax.](https://api.slack.com/reference/surfaces/formatting)
   */
  text: string
  /**
   * Slack channel to post message to.
   */
  channel?: string
  /**
   * User name to post messages as.
   */
  username?: string
  /**
   * URL for user icon image.
   */
  icon_url?: string
}
