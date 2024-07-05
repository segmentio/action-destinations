// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The environment for your Adjust account.
   */
  environment: string
  /**
   * The app token for your Adjust account. Can be overridden in the event mapping.
   */
  default_app_token?: string
  /**
   * The default event token. Can be overridden in the event mapping.
   */
  default_event_token?: string
  /**
   * Send the event creation time to Adjust.
   */
  send_event_creation_time?: boolean
}
