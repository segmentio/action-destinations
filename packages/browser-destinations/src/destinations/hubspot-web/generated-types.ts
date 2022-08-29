// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Hub ID of your Hubspot account.
   */
  portalId: string
  /**
   * Enable the European Data Center.
   */
  enableEuropeanDataCenter?: boolean
  /**
   * Fire a Page View immediately after an Identify to send the data to Hubspot.
   */
  flushIdentifyImmediately?: boolean
  /**
   * Format the event names for custom behavioral event automatically to standard Hubspot format (pe<HubID>_event_name).
   */
  formatCustomBehavioralEventNames: boolean
}
