// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Reddit Pixel ID
   */
  pixel_id: string
  /**
   * Limited Data Use - When the LDU flag is enabled, it may impact campaign performance and limit the size of targetable audiences. See [this documentation](https://business.reddithelp.com/s/article/Limited-Data-Use) for more information. If enabling this toggle, also go into each event and configure the Country and Region in the Data Processing Options for each event being sent.
   */
  ldu?: boolean
}
