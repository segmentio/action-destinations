// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Hub ID of your HubSpot account.
   */
  portalId: string
  /**
   * Enable this option if you would like Segment to load the HubSpot SDK for EU data residency.
   */
  enableEuropeanDataCenter?: boolean
  /**
   * Enable this option to fire a `trackPageView` HubSpot event immediately after each Segment `identify` call to flush the data to HubSpot immediately.
   */
  flushIdentifyImmediately?: boolean
  /**
   * Format the event names for custom behavioral event automatically to standard HubSpot format (`pe<HubID>_event_name`).
   */
  formatCustomBehavioralEventNames?: boolean
  /**
   * Enable this option if you would like Segment to automatically load the HubSpot Forms SDK onto your site.
   */
  loadFormsSDK?: boolean
}
