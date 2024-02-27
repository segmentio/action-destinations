// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The webhook provided by Slack to connect with the desired Slack workspace.
   */
  url: string
  /**
   * The text message to post to Slack. You can use [Slack's formatting syntax.](https://api.slack.com/reference/surfaces/formatting)
   */
  text: string
  /**
   * The channel within the Slack workspace. Do not include the `#` character. For example, use `general`, not `#general`.
   */
  channel?: string
  /**
   * The sender of the posted message.
   */
  username?: string
  /**
   * The URL of the image that appears next to the User.
   */
  icon_url?: string
}
