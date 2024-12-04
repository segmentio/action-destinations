// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Mixpanel project token.
   */
  projectToken: string
  /**
   * Mixpanel project secret.
   */
  apiSecret: string
  /**
   * Learn about [EU data residency](https://docs.mixpanel.com/docs/privacy/eu-residency) and [India data residency](https://docs.mixpanel.com/docs/privacy/in-residency)
   */
  apiRegion?: string
  /**
   * This value, if it's not blank, will be sent as segment_source_name to Mixpanel for every event/page/screen call.
   */
  sourceName?: string
  /**
   * This value, if it's 1 (recommended), Mixpanel will validate the events you are trying to send and return errors per event that failed. Learn more about the Mixpanel [Import Events API](https://developer.mixpanel.com/reference/import-events)
   */
  strictMode?: string
}
