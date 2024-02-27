// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Launchpad project secret. You can find that in the settings in your Launchpad.pm account.
   */
  apiSecret: string
  /**
   * Learn about [EU data residency](https://help.launchpad.pm).
   */
  apiRegion?: string
  /**
   * This value, if it's not blank, will be sent as segment_source_name to Launchpad for every event/page/screen call.
   */
  sourceName?: string
}
